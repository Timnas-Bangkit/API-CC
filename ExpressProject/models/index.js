const User = require('./User')
const UserProfile = require('./UserProfile')
const Post = require('./Post')

User.hasOne(UserProfile);
User.hasMany(Post);
Post.belongsTo(User);

module.exports = {User, UserProfile, Post};
