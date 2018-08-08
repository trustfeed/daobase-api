const router = require('express').Router();
const controller = require('./user.controller');

router.get('/', controller.get);
router.post('/', controller.post);

module.exports = router;
