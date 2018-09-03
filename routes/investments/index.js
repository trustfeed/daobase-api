import express from 'express';
import * as controller from './investments.controller';
import authMiddleware from '../../middleware/auth';

const router = express.Router();
router.use('/', authMiddleware);
router.get('/', controller.get);

module.exports = router;
