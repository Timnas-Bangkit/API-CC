const {Post, User, UserProfile, Application, CV} = require('../models')

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

exports.listCandidates = async (req, res) => {
  const post = await Post.findByPk(req.params.id, {
    include: [
      {model: Application, include: [
        {model: User, include: [
          {model: UserProfile, attributes: ['name', 'profilePic']},
          {model: CV, attributes: ['score', 'jobRole']}
        ], attributes: ['id'], as: 'user'}
      ], attributes: ['status']}
    ], 
    attributes: ['id', 'title', 'description', 'image'],
  });
  
  if(!post){
    return res.status(404).json({
      error: true,
      message: 'post id not found',
    });
  }

  if(await req.user.hasPost(post)){
    return res.status(200).json({
      error: false,
      data: post,
    });
  }else{
    return res.status(403).json({
      error: true,
      message: 'post not owned',
    });
  }

}

exports.updateCandidateStatus = async (req, res) => {
  const { status } = req.body;
  const { id, userid } = req.params;

  const post = await Post.findByPk(id, {
    include: [
      {model: Application, include: [
        {model: User, include: [
          {model: UserProfile, attributes: ['name', 'profilePic']},
        ], attributes: ['id'], as: 'user'},
      ], attributes: ['status'],
        where: {userId: userid}
      }
    ], 
    attributes: ['id', 'title', 'description', 'image'],
  });

  if(!post){
    return res.status(404).json({
      error: true,
      message: 'id not found for cadidate or post',
    })
  }

  if(await req.user.hasPost(post)){
    post.applications[0].status = status;
    await Application.update({status: status}, {
      where: { postId: id, userId: userid },
    });

    return res.status(200).json({
      error: false,
      data: post,
    });
  }else{
    return res.status(403).json({
      error: true,
      message: 'post not owned',
    });
  }
}
