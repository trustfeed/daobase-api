import express from 'express';
import * as controller from './campaigns.controller';

const router = express.Router();
router.post('/', controller.post);
router.get('/', controller.getAll);
router.get('/:id', controller.get);
router.put('/:id', controller.put);

module.exports = router;
