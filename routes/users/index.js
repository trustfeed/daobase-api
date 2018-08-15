import express from 'express';
import * as controller from './users.controller';
import authMiddleware from '../../middleware/auth';

const router = express.Router();
router.get('/', controller.get);
router.post('/', controller.post);
router.use('/:id', authMiddleware);
router.put('/:id', controller.put);

module.exports = router;
