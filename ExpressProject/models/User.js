const { DataTypes } = require('sequelize');
const { sequelize, Sequelize } = require('../config/sequelize.config');
const UserProfile = require('./UserProfile');
const Post = require('./Post')
const { roles } = require('../config/roles.config');

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
    role: {
      type: Sequelize.STRING,
      defaultValue: 'user',
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

User.prototype.getPermissions = function(){
  for (let index = 0; index < roles.length; index++) {
    const role = roles[index];
    if(role.name == this.role){
      return role.permissions;
    }
  }
  return null;
}

User.prototype.response = function(){
  return {
    id: this.id,
    username: this.username,
    email: this.email,
    role: this.role,
  }
}

User.prototype.profileResponse = async function(){
  return {
    id: this.id,
    username: this.username,
    profile: await (await this.getUser_profile()).responseData(),
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
