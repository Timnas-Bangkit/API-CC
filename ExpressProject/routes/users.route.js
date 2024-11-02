var express = require('express');
var router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const userController = require('../controllers/UserController'); 

router.use(authMiddleware.verify);

router.post('/logout', userController.logout);

module.exports = router;
