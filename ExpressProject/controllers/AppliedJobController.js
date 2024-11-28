const {Post, User, UserProfile, Application} = require('../models')

exports.apply = async (req, res) => {
  const postid = req.params.id;
  
  const post = await Post.findByPk(postid);
  if(!post){
    return res.status(404).json({
      error: true, 
      message: 'post id not found',
    });
  }

  const isApplied = await req.user.hasPoster(post);
  if(isApplied){
    return res.status(409).json({
      error: true, 
      message: 'user already applied',
    });
  }

  
  await req.user.addPoster(post).then(() => {
    return res.status(201).json({
      error: false,
      message: 'applied!',
    });
  }).catch((err) => {
    console.log(err);
    return res.status(500).json({
      error: true,
      message: 'could not apply',
    });
  });
};

exports.withdraw = async (req, res) => {
  const postid = req.params.id;
  
  const post = await Post.findByPk(postid);
  if(!post){
    return res.status(404).json({
      error: true, 
      message: 'post id not found',
    });
  }

  const isApplied = await req.user.hasPoster(post);
  if(!isApplied){
    return res.status(400).json({
      error: true, 
      message: 'user not yet applied',
    });
  }

  await req.user.removePoster(post).then(() => {
    return res.status(200).json({
      error: false,
      message: 'withdrawn!',
    });
  }).catch((err) => {
    console.log(err);
    return res.status(500).json({
      error: true,
      message: 'could not withdraw',
    });
  });
}

exports.listAppliedJobs = async (req, res) => {
  const userid = req.params.id;
  
  const user = await User.findByPk(userid);
  if(!user){
    return res.status(404).json({
      error: true, 
      message: 'user id not found',
    });
  }
  const jobs = await User.findByPk(userid, {
    include: [
      {model: UserProfile, attributes: ['name', 'profilePic']},
      {model: Application, include: [
        {model: Post, attributes: ['id', 'title', 'description', 'image'], as: 'post'}
      ], attributes: ['status']},
    ],
    attributes: ['id'],
  })
  return res.status(200).json({
    error: false,
    data: jobs,
  });
};

exports.listMyAppliedJobs = async (req, res) => {
  const jobs = await User.findByPk(req.user.id, {
    include: [
      {model: UserProfile, attributes: ['name', 'profilePic']},
      {model: Application, include: [
        {model: Post, attributes: ['id', 'title', 'description', 'image'], as: 'post'}
      ], attributes: ['status']},
    ],
    attributes: ['id'],
  });
  return res.status(200).json({
    error: false,
    data: jobs,
  });
};
