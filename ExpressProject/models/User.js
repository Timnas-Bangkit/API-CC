const { DataTypes } = require('sequelize');
const { sequelize, Sequelize } = require('../models/index');

const User = sequelize.define('User', {
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
        allowNull: true
    }
});

module.exports = User;