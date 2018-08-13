import express from 'express';
import campaigns from './campaigns';
import authMiddleware from '../../middleware/auth';

const router = express.Router();
router.use('/', authMiddleware);
router.use('/campaigns', campaigns);

module.exports = router;
