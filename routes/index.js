import express from 'express';
import users from './users';
import auth from './auth';
import admin from './admin';

const router = express.Router();
router.use('/users', users);
router.use('/auth', auth);
router.use('/admin', admin);

export default router;
