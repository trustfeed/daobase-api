import express from 'express';
import * as controller from './campaigns.controller';
import authMiddleware from '../../middleware/auth';

const router = express.Router();
router.use('/', authMiddleware);
router.get('/', controller.getAll);
router.get('/:id', controller.get);

module.exports = router;
