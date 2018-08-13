import express from 'express';
import * as controller from './campaigns.controller';

const router = express.Router();
router.post('/', controller.post);
router.get('/', controller.getAll);
router.get('/:id', controller.get);
router.put('/:id', controller.put);
router.post('/:id/image', controller.imageURL);
router.post('/:id/whitepaper', controller.pdfURL);

module.exports = router;
