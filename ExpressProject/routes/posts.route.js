var express = require('express');
var router = express.Router();
const multer = require('multer');

const { enumPermissions } = require('../config/roles.config');
const authMiddleware = require('../middleware/auth.middleware');
const postController = require('../controllers/PostController');
const { checkSchema } = require('express-validator');
const { postSchema, postSchemaUpdate } = require('../requests/post.schema');
const validationMiddleware = require('../middleware/validation.middleware');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {fileSize: 5 * 1024 * 1024},
});

router.use(authMiddleware.verify);

router.get('/', authMiddleware.authorize(['owner', 'techWorker'], enumPermissions.listAllJobs), postController.getAll);
router.get('/me', authMiddleware.authorize(['owner', 'techWorker'], enumPermissions.readJob), postController.getMine);
router.get('/:id', authMiddleware.authorize(['owner', 'techWorker'], enumPermissions.readJob), postController.get);

router.post('/', authMiddleware.authorize(['owner'], enumPermissions.createJob), 
  upload.single('image'), 
  checkSchema(postSchema),
  validationMiddleware.validate,
  postController.create);
router.put('/:id', authMiddleware.authorize(['owner'], enumPermissions.updateJob), 
  upload.single('image'), 
  checkSchema(postSchemaUpdate),
  validationMiddleware.validate,
  postController.update);

router.delete('/:id', authMiddleware.authorize(['owner'], enumPermissions.deleteJob), postController.delete);

router.post('/:id/like', authMiddleware.authorize(['owner', 'techWorker'], enumPermissions.interractAllJobs), postController.setLike);
router.delete('/:id/like', authMiddleware.authorize(['owner', 'techWorker'], enumPermissions.interractAllJobs), postController.delLike);

module.exports = router
