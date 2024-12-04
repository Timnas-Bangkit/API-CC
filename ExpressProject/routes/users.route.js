var express = require('express');
var router = express.Router();
const multer = require('multer');
const { body } = require('express-validator');

const { enumPermissions } = require('../config/roles.config');
const authMiddleware = require('../middleware/auth.middleware');
const authController = require('../controllers/AuthController');
const userController = require('../controllers/UserController'); 
const validationMiddleware = require('../middleware/validation.middleware');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: 50 * 1024 * 1024,
});

router.use(authMiddleware.verify);

router.post('/role', 
  authMiddleware.authorize(['user']), 
  body("role").exists().withMessage("`role` is required"),
  body("role").isInt({
    min: 2,
    max: 3
  }).withMessage("`role` invalid value, must be between 2 & 3"),
  validationMiddleware.validate,
  authController.setRole);

router.get('/', authMiddleware.authorize([], enumPermissions.listAllUsers), userController.getAllUsers)
router.get('/:id(\\d+)', authMiddleware.authorize([], enumPermissions.readUser), userController.getUser);
router.get('/me' , userController.getMine)
router.post('/logout', userController.logout);

router.post('/profile-pic', 
  authMiddleware.authorize(['techWorker', 'owner']),
  upload.single('file'), 
  body('file').custom((value, {req}) => {
    const file = req.file;
    if(!file){
      throw new Error("`file` is required");
    }
    if(!(file.mimetype === 'image/png' || file.mimetype === 'image/jpeg')){
      throw new Error("`file` format should be image/png or image/jpeg");
    }
    if(file.buffer.length > 5 * 1024 * 1024){
      throw new Error("`file` size must be lower than 5MB");
    }
    return true;
  }),
  validationMiddleware.validate,
  userController.updateProfilePic);

router.delete('/profile-pic', userController.deleteProfilePic);

router.put('/', authMiddleware.authorize(['owner'], enumPermissions.updateProfile),
  body("name").isString().withMessage("`name` is in string format").optional(),
  body("phone").isMobilePhone('id-ID').withMessage("`phone` is in phone format (ID localization)").optional(),
  body("bio").isString().withMessage("`bio` is in string format").optional(),
  body("socialLinks").isObject().withMessage("`socialLinks` is in object format").optional(),
  body("companyLocation").isString().withMessage("`companyLocation` is in string format").optional(),
  validationMiddleware.validate,
  userController.updateProfile);

router.post('/cv', 
  authMiddleware.authorize(['techWorker'], enumPermissions.createCV),
  upload.single('cv'),
  body("cv").custom((value, {req}) => {
    const file = req.file;
    if(!file){
      throw new Error("`cv` is required");
    }
    if(!(file.mimetype === 'application/pdf')){
      throw new Error("`cv` format should be document/pdf");
    }
    if(file.buffer.length > 10 * 1024 * 1024){
      throw new Error("`cv` size must be lower than 10MB");
    }
    return true;
  }),
  validationMiddleware.validate,
  userController.uploadCv);

module.exports = router;
