var express = require('express');
var router = express.Router();
const multer = require('multer');

const authMiddleware = require('../middleware/auth.middleware');
const postController = require('../controllers/PostController');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {fileSize: 5 * 1024 * 1024},
});

router.use(authMiddleware.verify);

router.get('/', postController.getAll);
router.get('/:id', postController.get);
router.post('/', upload.single('image'), postController.create);
router.put('/:id', upload.single('image'), postController.update);
router.delete('/:id', postController.delete);

module.exports = router;
