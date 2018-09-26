import express from 'express';
import * as controller from './auth.controller';

const router = express.Router();
router.post('/', controller.post);

export default router;
