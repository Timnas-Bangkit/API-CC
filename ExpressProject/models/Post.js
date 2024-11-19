const { DataTypes } = require('sequelize');
const { sequelize, Sequelize } = require('../models/sequelize');

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
  image: {
    type: Sequelize.STRING,
    defaultValue: null
  },
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
