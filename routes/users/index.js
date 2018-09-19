import express from 'express';
import controller from './users.controller';

const router = express.Router();
// router.use('/', authMiddleware);
router.get('/', controller.get);
router.post('/', controller.post);
router.put('/', controller.put);

module.exports = router;
