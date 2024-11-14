const { Sequelize, DataTypes } = require('sequelize');
const dbConfig = require('../config/db.config');
const { logger } = require('../utils/logger');

const sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password,{
    port: dbConfig.port,
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: false,
    dialectOptions: {
        socketPath: dbConfig.socketPath
    }
});

sequelize.authenticate()
    .then(() => {
        logger.info('[DB] Connection has been established successfully.');
    })
    .catch(err => {
        logger.error('[DB] Unable to connect to the database:', err);
    });

module.exports = { sequelize, Sequelize };