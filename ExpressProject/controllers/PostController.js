const {Post, User, UserProfile} = require('../models')
const { generateRandomFilename } = require('../helper/generator');
const multer = require('multer');
const { bucket, bucketConfig } = require('../config/bucket.config')
const { logger } = require('../utils/logger');
const { post } = require('../app');

const getNarrowData = async (id=null) => {
  if(id == null){
    return await Post.findAll({include: [
      {model: User, attributes: ['id'], 
        include: [{model: UserProfile, attributes: ['name', 'profilePic']}]},
    ], attributes: {exclude: 'userId'}});
  }else{
    return await Post.findByPk(id, { attributes: {exclude: 'userId'},
      include: [
        {model: User, attributes: {exclude: ['password', 'token']}, include: [
          {model: UserProfile, attributes: ['name', 'profilePic']}
        ]}
      ]
    })
  }
}

exports.getAll = async (req, res) => {
  const posts = await getNarrowData();
  res.status(200).json({
    message: 'success retrieve data',
    data: posts,
  });
}

exports.get = async (req, res) => {
  const post = await getNarrowData(req.params.id);
  if(post == null){
    logger.error(`[WEB] /api/posts/get/{id} id not found`);
    return res.status(404).json({ message: 'id not found' });
  }

  res.status(200).json({ message: 'success retrieve data', 
    data: post,
  });
}

exports.create = async (req, res) => {
  const {title, description} = req.body;
  const image = req.file;
  if(!image || !(image.mimetype === 'image/png' || image.mimetype === 'image/jpeg')){
    return res.status(400).json({message: 'unsupported format'});
  }

  if(!title){
    return res.status(400).json({message: 'title need to be filled'});
  }
  
  const filename = bucketConfig.postPath + generateRandomFilename(image.originalname);
  const fileUpload = bucket.file(filename);
  await fileUpload.save(image.buffer, {
    contentType: image.mimetype
  }).catch((err)=>{
    logger.error(`[WEB] failed to save bucket object`);
    return res.status(500).json({
      message: 'failed to save file',
    });
  });

  const post = new Post();
  post.title = title;
  post.description = description;
  post.image = 'https://storage.googleapis.com/' + bucketConfig.name + '/' + filename;
  await post.save();
  post.setUser(req.user);

  res.status(201).json({
    message: 'success creating post',
    data: post,
  });
}

exports.update = async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  if(post == null){
    logger.error(`[WEB] /api/posts/get/{id} id not found`);
    return res.status(404).json({ message: 'id not found' });
  }
  
  const postUser = await post.getUser();
  if(req.user.id != postUser.id){
    return res.status(403).json({
      message: 'cannot edit another user post',
    });
  }

  const {title, description} = req.body;
  const image = req.file;
  if(title){
    post.title = title;
  }
  if(description){
    post.description = description;
  }
  if(image){
    let filename = '';
    if(post.image){
      const arr = post.image.split('/');
      const name = arr[arr.length - 1];
      filename = bucketConfig.postPath + name;
    }else{
      filename = bucketConfig.postPath + generateRandomFilename(image.originalname);
    }

    const fileUpload = bucket.file(filename);
    await fileUpload.save(image.buffer, {
      contentType: image.mimetype
    }).catch((err)=>{
      logger.error(`[WEB] failed to save bucket object`);
      return res.status(500).json({
        message: 'failed to save file',
      });
    });
    post.image = 'https://storage.googleapis.com/' + bucketConfig.name + '/' + filename;
  }

  //catch
  await post.save();

  res.status(200).json({
    message: 'success updating post',
    data: post,
  });
}

exports.delete = async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  if(post == null){
    logger.error(`[WEB] /api/posts/get/{id} id not found`);
    return res.status(404).json({ message: 'id not found' });
  }
  
  const postUser = await post.getUser();
  if(req.user.id != postUser.id){
    return res.status(403).json({
      message: 'cannot delete another user post',
    });
  }

  await post.destroy().catch((err)=>{
    return res.status(500).json({
      message: 'failed to delete post',
    });
  });
  return res.status(200).json({
    message: 'success deleting post',
  });
}
