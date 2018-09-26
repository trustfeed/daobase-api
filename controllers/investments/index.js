import express from 'express';
import controller from './investments.controller';
import authMiddleware from '../../middleware/auth';

const router = express.Router();
router.use('/', authMiddleware);
router.get('/', controller.get);

export default router;
