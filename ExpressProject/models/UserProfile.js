const { DataTypes } = require('sequelize');
const { sequelize, Sequelize } = require('../config/sequelize.config');
const User = require('./User.js');

const UserProfile = sequelize.define('user_profile', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  profilePic: {
    type: Sequelize.STRING,
    defaultValue: 'https://storage.googleapis.com/findup-public/default.jpg',
  },
  name: {
    type: Sequelize.STRING,
  },
  phone: {
    type: Sequelize.STRING,
  },
  bio: {
    type: DataTypes.TEXT,
  },
  socialLinks: {
    type: DataTypes.STRING
  },
  companyLocation: {
    type: DataTypes.STRING,
  }
});

UserProfile.prototype.responseData = async function(){
  return {
    id: this.id,
    profilePic: this.profilePic,
    name: this.name,
    phone: this.phone,
    bio: this.bio,
    companyLocation: this.companyLocation,
    socialLinks: JSON.parse(this.socialLinks),
    updatedAt: this.updatedAt,
  }
}

module.exports = UserProfile;
