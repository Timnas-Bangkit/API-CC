var express = require('express');
var router = express.Router();
const multer = require('multer');

const authMiddleware = require('../middleware/auth.middleware');
const userController = require('../controllers/UserController'); 
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {fileSize: 5 * 1024 * 1024},
});

router.use(authMiddleware.verify);

router.get('/', userController.getAllUsers)
router.get('/:id', userController.getUser);
router.post('/logout', userController.logout);
router.put('/', userController.updateProfile);
router.post('/profile-pic', upload.single('file'), userController.updateProfilePic);

module.exports = router;
