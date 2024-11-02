const { logger } = require('../utils/logger'); 

exports.incomingRequest = (req, res, next) => {
    logger.info(`[WEB] Incoming request: ${req.method} ${req.originalUrl} from ${req.ip}`);
    next();
};
