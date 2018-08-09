import express from 'express';
import * as controller from './users.controller';

const router = express.Router();
router.get('/', controller.get);
router.post('/', controller.post);

module.exports = router;
