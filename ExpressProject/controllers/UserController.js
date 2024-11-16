const express = require('express');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const { bucket, bucketConfig } = require('../config/bucket.config')
const crypto = require('crypto');
const path = require('path');
const UserProfile = require('../models/UserProfile');
const multer = require('multer');

const generateRandomFilename = (originalname) => {
    const randomString = crypto.randomBytes(16).toString('hex');
    const extname = path.extname(originalname);
    return `${randomString}${extname}`;
}

exports.logout = async (req, res) => {
    const ret = await req.user.save();
    if(!ret) {
        logger.error(`[WEB] /api/v1/user/logout Failed to logout`);
        return res.status(500).json({ message: 'Server error' })
    }
    req.user.token = null;
    res.status(200).json({ message: 'User logged out successfully' });
}

exports.get = async (req, res) => {
  const user = req.user;
  res.status(200).json({ message: 'Success retrieve data', data: {
    id: user.id,
    username: user.username,
  } });
}

exports.getUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if(user == null){
    logger.error(`[WEB] /api/users/get/{id} id not found`);
    return res.status(404).json({ message: 'id not found' });
  }

  res.status(200).json({ message: 'success retrieve data', data: {
    id: user.id,
    username: user.username,
    profile: await (await user.getUser_profile()).responseData(),
  }});
}

//TODO paginate
exports.getAllUsers = async (req, res) => {
  const users = await User.findAll({
    attributes: ['id', 'username']
  });
  res.status(200).json({
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

  await profile.save();

  res.status(200).json({
    message: 'Success updating',
    data: await req.user.responseData(),
  })
}


exports.updateProfilePic = async (req, res) => {
  const file = req.file;
  if(!file){
    return res.status(400).json({
      message: 'no file uploaded',
    });
  }
  
  const filename = bucketConfig.picPath + generateRandomFilename(file.originalname);
  const fileUpload = bucket.file(filename);
  await fileUpload.save(file.buffer, {
    contentType: file.mimetype
  }).then((err) => {
    if(err){
      logger.error(`[WEB] failed to save bucket object`);
      return res.status(500).json({
        message: 'failed to save file',
      });
    }
  });
  
  const profile = await req.user.getUser_profile();
  profile.profilePic = 'https://storage.googleapis.com/' + bucketConfig.name + '/' + filename;
  await profile.save();

  res.status(200).json({
    message: 'success updating profile pic',
    data: await profile.responseData(),
  });
}
