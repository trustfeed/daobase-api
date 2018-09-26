import express from 'express';
import trustfeedAddress from '../../middleware/trustfeedAddress';
import auth from '../../middleware/auth';
import controller from './trustfeed.controller';

const router = express.Router();
router.use('/', auth);
router.use('/', trustfeedAddress);

router.get('/kycs-to-review', controller.kycsToReview);
router.post('/kyc-reviewed', controller.kycReviewed);
router.post('/kyc-failed', controller.kycFailed);

router.get('/campaigns-to-review', controller.campaignsToReview);
router.post('/campaign-reviewed', controller.campaignReviewed);
router.post('/campaign-failed', controller.campaignFailed);

export default router;
