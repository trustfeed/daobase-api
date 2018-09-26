import express from 'express';
import controller from './nonce.controller';

const router = express.Router();
router.get('/', controller.get);

export default router;
