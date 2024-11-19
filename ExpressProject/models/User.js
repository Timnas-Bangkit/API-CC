const { DataTypes } = require('sequelize');
const { sequelize, Sequelize } = require('../models/sequelize');
const UserProfile = require('./UserProfile');
const Post = require('./Post')

//TODO new model for user profile
//TODO role
const User = sequelize.define('user', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
        isEmail: true
    },
    password: {
        type: DataTypes.STRING(64),
        allowNull: false,
        validate: {
            is: /^\$2[abxy]\$\d{2}\$[\.\/A-Za-z0-9]{53}$/g    // hash pattern
        },
    },
    token: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
    },
});

User.prototype.responseData = async function(){
  return {
    id: this.id,
    username: this.username,
    profile: await (await this.getUser_profile()).responseData(),
    posts: await (await this.getPost()).responseData(),
  }
}
User.prototype.data = async function(){
  return {
    id: this.id,
    username: this.username,
    profile: await (await this.getUser_profile()).responseData(),
  }
}


module.exports = User;
