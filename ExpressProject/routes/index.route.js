var express = require('express');
var router = express.Router();
const authController = require('../controllers/AuthController');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/users/register', authController.register);
router.post('/users/login', authController.login);

module.exports = router;
