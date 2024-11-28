const express = require('express');
const {User, Post} = require('../models');
const { logger } = require('../utils/logger');
const { bucket, bucketConfig } = require('../config/bucket.config')
const UserProfile = require('../models/UserProfile');
const multer = require('multer');
const { generateRandomFilename } = require('../helper/generator');

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
  const user = await User.findByPk(req.params.id, {attributes: {exclude: ['password', 'token', 'updatedAt']},
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
  const profile = await req.user.getProfile();
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
  const profile = await req.user.getProfile();

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
  const profile = await req.user.getProfile();
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
