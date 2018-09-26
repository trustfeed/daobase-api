import express from 'express';
import controller from './kyc.controller';
import authMiddleware from '../../middleware/auth';
import verifiedEmail from '../../middleware/verifiedEmail';

const router = express.Router();
router.use('/', authMiddleware);
router.use('/', verifiedEmail);
router.post('/passport-image', controller.passportImage);
router.post('/facial-image', controller.facialImage);
router.post('/', controller.post);

export default router;
