const express = require('express');
const {User, Post, CV} = require('../models');
const { logger } = require('../utils/logger');
const { bucket, bucketConfig, privateBucket, privateBucketConfig } = require('../config/bucket.config')
const UserProfile = require('../models/UserProfile');
const multer = require('multer');
const { generateRandomFilename } = require('../helper/generator');
const { cvparsing } = require('../config/pubsub.config');
const axios = require('axios');
const { Skills, WorkExp, Certs } = require('../models/CV');
const { getCvScore } = require('../config/vertex.config');
const { getScoringModel, predictScore } = require('../helper/model');
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
  let timeout;

  const cv = req.file;
  const filename = privateBucketConfig.cvPath + generateRandomFilename(cv.originalname);
  const fileupload = privateBucket.file(filename);
  await fileupload.save(cv.buffer, {
    contentType: cv.mimetype
  }).then(() => {
    logger.info(`[WEB] object saved`);
    timeout = setTimeout(() => {
      sub.close();
      return res.status(500).json({
        error: true,
        message: 'timeout!',
      });
    }, 75000);
  }).catch((err) => {
    console.log(err);
    return res.status(500);
  });

  const sub = cvparsing.pubsub
    .topic(cvparsing.pubsubTopic)
    .subscription(cvparsing.pubsubSubs, {ackDeadline: 10});


  sub.on('message', async (message) => {
    const data = JSON.parse(message.data.toString());
    const filename_json = filename.replace('.pdf', '.json')
    if(data.filename == filename_json){
      clearTimeout(timeout);
      console.log('message ack\'ed');
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

      const responseData = {
        cv: jsonObject.cv || null,
        jobRole: jsonObject.jobRole || null,
      }

      try{
        console.log('inferencing...');
        const score = await predictScore({
          input_ids: jsonObject.input_ids[0], //int32
          attention_mask: jsonObject.attention_mask[0], //int32
          numerical_features: jsonObject.numerical_features[0],
        });
        console.log('done inferencing...');
        responseData.score = score;
      }catch(err){
        console.log(err);
        logger.error('[AI] failed to do inference');
        return res.status(500).json({
          error: true,
          message: 'failed to do inference',
        });
      }

      const cvName = Object.keys(responseData.cv)[0];
      const personalInfo = responseData.cv[cvName]['Personal Info'];
      const skills = responseData.cv[cvName]['Skills'];
      const workExps = responseData.cv[cvName]['Work Experience'];
      const certs = responseData.cv[cvName]['Certification'];

      const profile = await req.user.getUser_profile();
      if(profile){
        profile.name = cvName;
        profile.phone = '62' + phoneUtil.parseAndKeepRawInput(personalInfo['Phone Number'], 'ID').getNationalNumber();
        profile.socialLinks = JSON.stringify({
          github: personalInfo.Github,
          linkedin: personalInfo.LinkedIn
        });
        await profile.save();
      }

      let cv = await req.user.getCv();
      if(cv){
        cv.purge();
      }else{
        cv = await req.user.createCv();
      }
      cv.score = responseData.score;
      cv.jobRole = responseData.jobRole.toLowerCase();
      cv.email = personalInfo['Email'];
      skills.forEach(async (e) => {
        await cv.createSkill({skill: e});
      });
      workExps.forEach(async e => {
        await cv.createWorkExp({
          companyName: e['Company Name'],
          startDate: e['Start Date'],
          endDate: e['End Date'],
          position: e['Position'],
          description: e['Description'].toString(),
        });
      });
      certs.forEach(async e => {
        await cv.createCert({
          certification: e,
        });
      });
      await cv.save();

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

exports.getCv = async (req, res) => {
  const userid = req.params.id;
  const user = await User.findByPk(userid, {
    include: [
      {model: UserProfile, attributes: ['email', 'name']},
    ]
  });
  if(!user){
    return res.status(404).json({
      error: true,
      message: '`id` not found',
    })
  }

  const cv = await user.getCv();
  if(cv){
    const ret = {
      id: user.id,
      username: user.user_profile.name,
      email: cv.email,
      role: user.role,
      cv: await cv.response(),
  }

    return res.status(200).json({
      error: false,
      data: ret,
    });
  }else{
    return res.status(404).json({
      error: true,
      message: 'cv not found',
    });
  }
};

exports.getMyCv = async (req, res) => {
  const profile = await req.user.getUser_profile();
  const cv = await req.user.getCv();
  if(cv){
    const ret = {
      id: req.user.id,
      username: profile.name,
      email: cv.email,
      role: req.user.role,
      cv: await cv.response(),
    }
    return res.status(200).json({
      error: false,
      data: ret,
    });
  }else{
    return res.status(404).json({
      error: true,
      message: 'cv not found',
    });
  }
}
