import express from 'express';
import users from './users';
import auth from './auth';
import admin from './admin';
import campaigns from './campaigns';
import verify from './verify';

const router = express.Router();
router.use('/users', users);
router.use('/auth', auth);
router.use('/admin', admin);
router.use('/campaigns', campaigns);
router.use('/verify', verify);

export default router;
