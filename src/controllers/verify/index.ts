import express from 'express';
import * as controller from './verify.controller';

const router = express.Router();
router.post('/email', controller.email);

export default router;
