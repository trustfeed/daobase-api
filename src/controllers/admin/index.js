import express from 'express';
import hostedCampaigns from './hostedCampaigns';
import externalCampaigns from './externalCampaigns';
import authMiddleware from '../../middleware/auth';
import verifiedEmail from '../../middleware/verifiedEmail';

const router = express.Router();
router.use('/', authMiddleware);
router.use('/', verifiedEmail);
router.use('/hosted-campaigns', hostedCampaigns);
router.use('/external-campaigns', externalCampaigns);

export default router;
