const router = require('express').Router()
const controller = require('./campaign.controller')
const authMiddleware = require('../../../middlewares/auth')

router.use('/:id', authMiddleware)
router.get('/:id', controller.get)
router.put('/:id', controller.put)

router.use('/', authMiddleware)
router.post('/', controller.post)

module.exports = router
