import express from 'express';
import controller from './verify.controller';

const router = express.Router();
router.post('/email', controller.email);

module.exports = router;
