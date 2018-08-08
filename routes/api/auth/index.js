const router = require('express').Router();
const controller = require('./auth.controller');

router.post('/', controller.post);

module.exports = router;
