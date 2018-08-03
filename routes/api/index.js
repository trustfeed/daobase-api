const router = require('express').Router();
const auth = require('./auth');
const user = require('./user');
const campaign = require('./campaign');

router.use('/auth', auth);
router.use('/user', user);
router.use('/campaign', campaign);

module.exports = router;
