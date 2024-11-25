const { DataTypes } = require('sequelize');
const { sequelize, Sequelize } = require('../config/sequelize.config');

const Post = sequelize.define('post', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  description: {
    type: Sequelize.STRING,
  },
  summary: {
    type: Sequelize.STRING,
  },
  neededRole: {
    type: Sequelize.STRING,
  },
  detail: {
    type: Sequelize.STRING,
  },
  image: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  likeCount: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  }
});

Post.prototype.responseData = async function(){
  return {
    id: this.id,
    title: this.title,
    description: this.description,
    image: this.image,
    updatedAt: this.updatedAt,
    createdAt: this.createdAt,
    owner: await (await this.getUser()).data()
  }
}

module.exports = Post;
