const jwt = require('jsonwebtoken');
const { logger } = require('./logger');

const config = {
    secret: process.env.JWT_SECRET || 'frog go mlem mlem',
    expiresIn: '1h'
};

const generateToken = (payload) => {
    return jwt.sign(payload, config.secret, { expiresIn: config.expiresIn });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, config.secret);
    } catch (err) {
        logger.warn(`[JWT] verifyToken: ${err}`);
        return null;
    }
};

module.exports = {
    generateToken,
    verifyToken
};
