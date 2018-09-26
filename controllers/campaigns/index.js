import express from 'express';
import controller from './campaigns.controller';
import authMiddleware from '../../middleware/auth';

const router = express.Router();
router.use('/', authMiddleware);
router.get('/', controller.getAll);
router.get('/:id', controller.get);

router.post('/:id/alternative-payment', controller.alternativePayment);

export default router;
