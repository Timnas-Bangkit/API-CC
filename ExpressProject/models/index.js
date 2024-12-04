const User = require('./User')
const UserProfile = require('./UserProfile')
const Post = require('./Post')
const PostLike = require('./PostLike')
const Application = require('./Application');
const { CV } = require('./CV');

User.hasOne(UserProfile);
User.hasMany(Post);
Post.belongsTo(User);

Post.belongsToMany(User, {through: PostLike, as: 'userLike', foreignKey: 'userId'});
User.belongsToMany(Post, {through: PostLike, as: 'postLike', foreignKey: 'postId'});

Post.belongsToMany(User, {through: Application, as: 'candidate', foreignKey: 'postId'});
User.belongsToMany(Post, {through: Application, as: 'poster', foreignKey: 'userId'});
Application.belongsTo(Post, {as: 'post', foreignKey: 'postId'});
Application.belongsTo(User, {as: 'user', foreignKey: 'userId'});
Post.hasMany(Application);
User.hasMany(Application);

User.hasOne(CV, {
  foreignKey: 'userId',
});

module.exports = {User, UserProfile, Post, Application, CV};
