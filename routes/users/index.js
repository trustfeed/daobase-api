import express from 'express';
import * as controller from './users.controller';
import authMiddleware from '../../middleware/auth';

const router = express.Router();
// router.use('/', authMiddleware);
router.get('/', controller.get);
router.post('/', controller.post);
router.put('/', controller.put);

module.exports = router;
