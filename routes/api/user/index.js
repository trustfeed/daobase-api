const router = require('express').Router()
const controller = require('./user.controller')
const authMiddleware = require('../../../middlewares/auth')

router.use('/', authMiddleware)
router.get('/', controller.get)

module.exports = router
