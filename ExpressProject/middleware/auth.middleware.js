const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const { logger } = require('../utils/logger'); 

exports.verify = async (req, res, next) => {
    logger.info(`[WEB] auth.middleware verifying token...`);
    if(req.header('Authorization') == null){
      return res.status(403).json({
        error: true,
        message: 'not yet authenticated'
      });
    }

    const token = req.header('Authorization').replace('Bearer ', '');

    if (token === null) {
        logger.warn(`[WEB] auth.middleware no token provided`);
        return res.status(401).send({ error: true, message: 'Access denied. No token provided.' });
    }

    const decoded = verifyToken(token);
    if (decoded === null) {
        logger.warn(`[WEB] auth.middleware invalid token`);
        return res.status(400).send({ error: true, message: 'invalid token' });
    }

    req.user = await User.findOne({ where: { email: decoded.email } });

    if(req.user == null || req.user.token !== token) {
        logger.warn(`[WEB] auth.middleware token mismatch`);
        return res.status(400).send({ error: true, message: 'Token mismatch' });
    }

    logger.info(`[WEB] auth.middleware token verified`);
    next();
};

exports.authorize = (roles=[], permission=null) => {
  return (req, res, next) => {
    let isAuthorized = false;
    const user = req.user;
    if(roles.length > 0){
      isAuthorized = roles.includes(user.role);

      if(permission && isAuthorized){
        const permissions = user.getPermissions();
        if(permissions){
          isAuthorized = permissions.includes(permission);
        }
      }

    }else{
      if(permission){
        const permissions = user.getPermissions();
        if(permissions){
          isAuthorized = permissions.includes(permission);
          console.log(isAuthorized);
        }
      }
    }

    if(isAuthorized){
      next();
    }else{
      return res.status(403).json({
        error: true,
        message: 'not yet authorized',
      })
    }
  };
};
