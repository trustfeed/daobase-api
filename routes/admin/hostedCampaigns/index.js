import express from 'express';
import * as controller from './campaigns.controller';

const router = express.Router();
router.post('/', controller.post);
router.get('/', controller.getAll);

router.get('/:id', controller.get);
router.put('/:id/on-chain-data', controller.putOnChainData);
router.put('/:id/off-chain-data', controller.putOffChainData);

router.post('/:id/cover-image', controller.coverImageURL);
router.post('/:id/white-paper', controller.pdfURL);

router.post('/:id/submit-for-review', controller.submitForReview);
router.post('/:id/review-passed', controller.acceptReview);
router.get('/:id/deployment-transaction', controller.deploymentTransaction);
router.post('/:id/finalise-deployment', controller.finaliseDeployment);

module.exports = router;