const {Post, User, UserProfile} = require('../models')
const { generateRandomFilename } = require('../helper/generator');
const multer = require('multer');
const { bucket, bucketConfig } = require('../config/bucket.config')
const { logger } = require('../utils/logger');

const getNarrowData = async (user, id=null) => {
  if(id == null){
    const ret = await Post.findAll({include: [
      {model: User, attributes: ['id'], 
        include: [{model: UserProfile, attributes: ['name', 'profilePic']}]},
    ], attributes: ['id', 'title', 'description', 'image', 'likeCount', 'updatedAt', 'createdAt']});

    for(const post of ret){
      post.setDataValue('isLiked', await post.hasUserLike(user));
    }
    return ret;
  }else{
    const ret = await Post.findByPk(id, { attributes: {exclude: 'userId'},
      include: [
        {model: User, attributes: {exclude: ['password', 'token']}, include: [
          {model: UserProfile, attributes: ['name', 'profilePic']}
        ]}
      ]
    });
    if(ret){
      ret.setDataValue('isLiked', await ret.hasUserLike(user));
      ret.setDataValue('neededRole', ret.neededRole.split(','));
      return ret;
    }else{
      return null;
    }
  }
}

exports.getAll = async (req, res) => {
  const posts = await getNarrowData(req.user);
  res.status(200).json({
    error: false,
    message: 'success retrieve data',
    data: posts,
  });
}

exports.getMine = async (req, res) => {
  const posts = await req.user.getPosts({include: [
      {model: User, attributes: ['id'], 
        include: [{model: UserProfile, attributes: ['name', 'profilePic']}]},
    ], attributes: ['id', 'title', 'description', 'image', 'likeCount', 'updatedAt', 'createdAt']});
  for(const post of posts){
    post.setDataValue('isLiked', await post.hasUserLike(req.user));
  }
  return res.status(200).json({
    error: false,
    data: posts,
  })
}


exports.get = async (req, res) => {
  const post = await getNarrowData(req.user, req.params.id);
  if(post == null){
    logger.error(`[WEB] /api/posts/get/{id} id not found`);
    return res.status(404).json({ message: 'id not found' });
  }

  res.status(200).json({ error: false, message: 'success retrieve data', 
    error: false,
    data: post,
  });
}

exports.create = async (req, res) => {
  const {title, description, summary, detail, neededRole} = req.body;
  const image = req.file;

  const post = new Post();
  post.title = title;
  post.description = description;
  if(summary) post.summary = summary;
  if(detail) post.detail = detail;
  if(neededRole) post.neededRole = neededRole.toString();
  post.image = null;

  if(image){
    const filename = bucketConfig.postPath + generateRandomFilename(image.originalname);
    const fileUpload = bucket.file(filename);
    await fileUpload.save(image.buffer, {
      contentType: image.mimetype
    }).catch((err)=>{
      logger.error(`[WEB] failed to save bucket object`);
      return res.status(500).json({
        error: true,
        message: 'failed to save file',
      });
    });
    post.image = 'https://storage.googleapis.com/' + bucketConfig.name + '/' + filename;
  }

  await post.save();

  post.setUser(req.user);
  if(post.neededRole) post.neededRole = post.neededRole.split(',');

  res.status(201).json({
    error: false,
    message: 'success creating post',
    data: post,
  });
}

exports.update = async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  if(post == null){
    logger.error(`[WEB] /api/posts/get/{id} id not found`);
    return res.status(404).json({ error: true, message: 'id not found' });
  }
  
  const postUser = await post.getUser();
  if(req.user.id != postUser.id){
    return res.status(403).json({
      error: true,
      message: 'cannot edit another user post',
    });
  }

  const {title, description, summary, detail, neededRole} = req.body;
  const image = req.file;
  if(title){
    post.title = title;
  }
  if(description){
    post.description = description;
  }
  if(summary){
    post.summary = summary;
  }
  if(detail){
    post.detail = detail;
  }
  if(neededRole){
    post.neededRole = neededRole.toString();
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
        error: true,
        message: 'failed to save file',
      });
    });
    post.image = 'https://storage.googleapis.com/' + bucketConfig.name + '/' + filename;
  }

  //catch
  await post.save();
  if(post.neededRole) post.neededRole = post.neededRole.split(',');

  res.status(200).json({
    error: false,
    message: 'success updating post',
    data: post,
  });
}

exports.delete = async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  if(post == null){
    logger.error(`[WEB] /api/posts/get/{id} id not found`);
    return res.status(404).json({ error: true, message: 'id not found' });
  }
  
  const postUser = await post.getUser();
  if(req.user.id != postUser.id){
    return res.status(403).json({
      error: true,
      message: 'cannot delete another user post',
    });
  }

  await post.destroy().catch((err)=>{
    return res.status(500).json({
      error: true,
      message: 'failed to delete post',
    });
  });
  return res.status(200).json({
    error: false,
    message: 'success deleting post',
  });
}

exports.setLike = async (req, res) => {
  const postId = req.params.id;

  const post = await Post.findByPk(postId);
  if(post == null){
    logger.error(`[WEB] /api/posts/{id}/like id not found`);
    return res.status(404).json({ error: true, message: 'id not found' });
  }

  liked = await post.hasUserLike(req.user.id);
  if(!liked){
    await post.addUserLike(req.user);
    post.likeCount += 1;
    await post.save();
    return res.status(200).json({ error: false, mesage: 'liked!' });
  }
  return res.status(409).json({ error: true,  message: 'post already liked by the user.' });
}

exports.delLike = async (req, res) => {
  const postId = req.params.id;

  const post = await Post.findByPk(postId);
  if(post == null){
    logger.error(`[WEB] /api/posts/{id}/like id not found`);
    return res.status(404).json({ error: true, message: 'id not found' });
  }

  liked = await post.hasUserLike(req.user.id);
  if(!liked){
    return res.status(409).json({ error: true, message: 'post not yet liked by the user.' });
  }
  await post.removeUserLike(req.user);
  post.likeCount -= 1;
  await post.save();
  return res.status(200).json({ error: false, mesage: 'unlike!' });
}
