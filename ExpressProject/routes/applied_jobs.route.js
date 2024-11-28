var express = require('express');
var router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const validationMiddleware = require('../middleware/validation.middleware');
const { enumPermissions } = require('../config/roles.config');
const { listAppliedJobs, listMyAppliedJobs, apply, withdraw } = require('../controllers/AppliedJobController');

router.use(authMiddleware.verify);

router.get('/users/:id(\\d+)/applied-ideas', 
  authMiddleware.authorize(['admin']),
  listAppliedJobs);
router.get('/users/me/applied-ideas', 
  authMiddleware.authorize(['techWorker'], enumPermissions.listAppliedJob),
  listMyAppliedJobs);

router.post('/posts/:id/apply',
  authMiddleware.authorize(['techWorker'], enumPermissions.createAppliedJob),
  apply);
router.post('/posts/:id/withdraw',
  authMiddleware.authorize(['techWorker'], enumPermissions.deleteAppliedJob),
  withdraw);

module.exports = router;
