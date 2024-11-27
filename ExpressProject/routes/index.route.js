var express = require('express');
var router = express.Router();
const authController = require('../controllers/AuthController');
const validationMiddleware = require('../middleware/validation.middleware');
const { regitrationSchema } = require('../requests/registration.schema');
const { body, checkSchema, check } = require('express-validator');
const { loginSchema } = require('../requests/login.schema');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/users/register', 
  checkSchema(regitrationSchema),
  validationMiddleware.validate,
  authController.register);

router.post('/users/login', 
  checkSchema(loginSchema),
  validationMiddleware.validate,
  authController.login);

module.exports = router;
