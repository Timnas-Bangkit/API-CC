const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const { logger } = require('../utils/logger'); 

exports.verify = async (req, res, next) => {
    logger.info(`[WEB] auth.middleware verifying token...`);
    const token = req.header('Authorization').replace('Bearer ', '');

    if (token === null) {
        logger.warn(`[WEB] auth.middleware no token provided`);
        return res.status(401).send({ error: 'Access denied. No token provided.' });
    }

    const decoded = verifyToken(token);
    if (decoded === null) {
        logger.warn(`[WEB] auth.middleware invalid token`);
        return res.status(400).send({ error: 'Invalid token' });
    }

    req.user = await User.findOne({ where: { email: decoded.email } });

    if(req.user.token !== token) {
        logger.warn(`[WEB] auth.middleware token mismatch`);
        return res.status(400).send({ error: 'Token mismatch' });
    }

    logger.info(`[WEB] auth.middleware token verified`);
    next();
   };
