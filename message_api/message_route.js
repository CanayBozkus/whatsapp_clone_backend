const express = require('express')
const { body } = require('express-validator');

const loginRequired = require('../middleware/login_required')
const controller = require('./message_controller')
const Constant = require('../user_api/constant')

const router = express.Router()

router.post(
    '/send-message',
    loginRequired,
    body('message').exists().isString().isLength({min: 1}),
    body('to')
        .notEmpty()
        .withMessage('Phone number is required')
        .replace(Constant.clearPhoneNumberRegex, '')
        .isLength({min: 10})
        .withMessage('Invalid phone number'),
    body('roomId').exists().isString().isLength({min: 1}),
    body('sendTime').exists().isISO8601(),
    controller.sendMessage
)


module.exports = router