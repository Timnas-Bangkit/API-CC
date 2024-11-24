const User = require('./User')
const UserProfile = require('./UserProfile')
const Post = require('./Post')
const PostLike = require('./PostLike')

User.hasOne(UserProfile);
User.hasMany(Post);
Post.belongsTo(User);

Post.belongsToMany(User, {through: PostLike, as: 'userLike', foreignKey: 'userId'});
User.belongsToMany(Post, {through: PostLike, as: 'postLike', foreignKey: 'postId'});

module.exports = {User, UserProfile, Post};
