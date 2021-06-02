const express = require('express')

const loginRequired = require('../middleware/login_required')
const controller = require('./message_controller')

const router = express.Router()

router.post(
    '/send-message',
    loginRequired,
    controller.sendMessage
)


module.exports = router