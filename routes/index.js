import express from 'express';
import users from './users';
import auth from './auth';
import admin from './admin';
import campaigns from './campaigns';

const router = express.Router();
router.use('/users', users);
router.use('/auth', auth);
router.use('/admin', admin);
router.use('/campaigns', campaigns);

export default router;
