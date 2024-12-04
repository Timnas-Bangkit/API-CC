const express = require('express');
const {User, Post} = require('../models');
const { logger } = require('../utils/logger');
const { bucket, bucketConfig, privateBucket, privateBucketConfig } = require('../config/bucket.config')
const UserProfile = require('../models/UserProfile');
const multer = require('multer');
const { generateRandomFilename } = require('../helper/generator');
const { cvparsing } = require('../config/pubsub.config');
const axios = require('axios');
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

exports.logout = async (req, res) => {
    const ret = await req.user.save();
    if(!ret) {
        logger.error(`[WEB] /api/v1/user/logout Failed to logout`);
        return res.status(500).json({ error: true, message: 'Server error' })
    }
    req.user.token = null;
    res.status(200).json({ error: false, message: 'User logged out successfully' });
}

exports.get = async (req, res) => {
  const user = req.user;
  res.status(200).json({ error: false, message: 'Success retrieve data', data: {
    id: user.id,
    username: user.username,
  } });
}

exports.getUser = async (req, res) => {
  const user = await User.findByPk(req.params.id, {attributes: {exclude: ['password', 'token', 'updatedAt', 'createdAt']},
    include: [
      {model: UserProfile, attributes: {exclude: ['id', 'userId', 'createdAt']}},
      {model: Post, attributes: {exclude: 'userId'}},
    ]
  });
  if(user == null){
    logger.error(`[WEB] /api/users/get/{id} id not found`);
    return res.status(404).json({ error: true, message: 'id not found' });
  }

  res.status(200).json({ error: false, message: 'success retrieve data', data: user});
}

//TODO paginate
exports.getAllUsers = async (req, res) => {
  const users = await User.findAll({
    attributes: ['id', 'username'],
    include: [
      {model: UserProfile, attributes: ['name', 'profilePic']}
    ]
  });
  res.status(200).json({
    error: false,
    message: "success retrieve data",
    data : users,
  });
}

exports.updateProfile = async (req, res) => {
  const profile = await req.user.getUser_profile();
  profile.name = req.body.name;
  profile.phone = req.body.phone;
  profile.bio = req.body.bio;
  profile.socialLinks = JSON.stringify(req.body.socialLinks);
  profile.companyLocation = req.body.companyLocation;

  await profile.save();

  res.status(200).json({
    erorr: false, 
    message: 'Success updating',
    data: await req.user.profileResponse(),
  })
}

exports.getMine = async (req, res) => {
  return res.status(200).json({
    error: false, 
    data: await req.user.profileResponse(),
  });
}

exports.updateProfilePic = async (req, res) => {
  const file = req.file;

  let filename = '';
  const arr = profile.profilePic.split('/');
  if(arr[arr.length - 1] == 'default.jpg' || null){
    filename = bucketConfig.picPath + generateRandomFilename(file.originalname);
  }else{
    filename = bucketConfig.picPath + arr[arr.length - 1];
  }
  
  const fileUpload = bucket.file(filename);
  await fileUpload.save(file.buffer, {
    contentType: file.mimetype
  }).then((err) => {
    if(err){
      logger.error(`[WEB] failed to save bucket object`);
      return res.status(500).json({
        error: true,
        message: 'failed to save file',
      });
    }
  });
  
  profile.profilePic = 'https://storage.googleapis.com/' + bucketConfig.name + '/' + filename;
  await profile.save();

  res.status(200).json({
    error: false,
    message: 'success updating profile pic',
    data: await profile.responseData(),
  });
}

exports.deleteProfilePic = async (req, res) => {
  const profile = await req.user.getUser_profile();
  const arr = profile.profilePic.split('/');
  if(arr[arr.length - 1] == 'default.jpg'){
    return res.status(403).json({
      error: true,
      message: 'failed to remove picture'
    });
  }

  const filename = bucketConfig.picPath + arr[arr.length - 1];
  await bucket.file(filename).delete().then(async () => {
    profile.profilePic = 'https://storage.googleapis.com/findup-public/default.jpg';
    await profile.save();
    res.status(200).json({
      error: false,
      message: 'success removing picture',
    });
  }).catch((err) => {
    return res.status(403).json({
      error: true,
      message: 'failed to remove picture'
    });
  });
}

exports.uploadCv = async (req, res) => {
  const cv = req.file;
  const filename = privateBucketConfig.cvPath + generateRandomFilename(cv.originalname);
  const fileupload = privateBucket.file(filename);
  await fileupload.save(cv.buffer, {
    contentType: cv.mimetype
  }).then(() => {
    logger.info(`[WEB] object saved`);
  }).catch((err) => {
    console.log(err);
    return res.status(500);
  });

  const sub = cvparsing.pubsub
    .topic(cvparsing.pubsubTopic)
    .subscription(cvparsing.pubsubSubs, {ackDeadline: 20});

  const timeout = setTimeout(() => {
    sub.close();
    return res.status(500).json({
      error: true,
      message: 'timeout!',
    });
  }, 20000);

  sub.on('message', async (message) => {
    const data = JSON.parse(message.data.toString());
    const filename_json = filename.replace('.pdf', '.json')
    if(data.filename == filename_json){
      clearTimeout(timeout);
      message.ack();
      sub.close();
      
      let jsonObject = {};
      {
        const download = privateBucket.file(filename_json);
        const chunks = []
        const buffer = await new Promise((resolve, reject) => { download.createReadStream()
            .on('data', chunk => chunks.push(chunk))
            .on('end', () => resolve(Buffer.concat(chunks)))
            .on('error', () => reject(null))
        });
        jsonObject = JSON.parse(buffer.toString('utf-8'));
      }

      //TODO request to model
      const request1 = axios.post(process.env.MODEL1_ENDPOINT, {
        instances: [ {
          input_ids: jsonObject.input_ids[0],
          attention_mask: jsonObject.attention_mask[0],
          numerical_features: jsonObject.numerical_features[0],
        }
        ],
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.VERTEX_AI_TOKEN || undefined}`,
          'Content-Type': 'application/json',
        },
      });

      const responses = await Promise.all([request1]);

      const responseData = {
        cv: jsonObject.cv,
      }

      if(responses[0]){
        const score = responses[0].data.predictions[0];
        responseData.score = score[0];
      }

      //TODO save profile
      const profile = await req.user.getUser_profile();
      const cvName = Object.keys(responseData.cv)[0];
      const personalInfo = responseData.cv[cvName]['Personal Info'];
      console.log(cvName);
      console.log(personalInfo);
      profile.name = cvName;
      profile.phone = '62' + phoneUtil.parseAndKeepRawInput(personalInfo['Phone Number'], 'ID').getNationalNumber();
      profile.socialLinks = JSON.stringify({
        github: personalInfo.Github,
        linkedin: personalInfo.LinkedIn
      });
      await profile.save();

      return res.status(200).json({
        error: false,
        data: responseData,
      });
    }else{
      message.nack();
    }
  });

  sub.on('error', () => {
    clearTimeout(timeout);
    sub.close();
    return res.status(500).json({
      error: true, 
      message: 'pub/sub error!',
    })
  });
}
