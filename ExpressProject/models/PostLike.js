const { DataTypes } = require('sequelize');
const { sequelize, Sequelize } = require('../config/sequelize.config');

// junction model
const PostLike = sequelize.define('post_like', {
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'user',
      key: 'id'
    },
  },

  postId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'post',
      key: 'id',
    },
  },
});

module.exports = PostLike;
