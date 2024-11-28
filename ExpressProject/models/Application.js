const { DataTypes } = require('sequelize');
const { sequelize, Sequelize } = require('../config/sequelize.config');
const User = require('./User');
const Post = require('./Post');

// Application == Apply to a Post (idea)
const Application = sequelize.define('application', {
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id',
    }
  },

  postId: {
    type: DataTypes.INTEGER,
    references: {
      model: Post,
      key: 'id',
    }
  },

  status: {
    type: DataTypes.STRING,
    defaultValue: 'applied',
  }
});

module.exports = Application;
