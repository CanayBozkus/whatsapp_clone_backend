const express = require('express')
const { body } = require('express-validator');

const loginRequired = require('../middleware/login_required')
const controller = require('./message_controller')
const Constant = require('../constant')

const router = express.Router()

router.post(
    '/send-message',
    loginRequired,
    body('message').exists().isString().isLength({min: 1}),
    body('from')
        .notEmpty()
        .withMessage('From Phone number is required')
        .replace(Constant.clearPhoneNumberRegex, '')
        .isLength({min: 10})
        .withMessage('Invalid phone number'),
    body('roomId').exists().isString().isLength({min: 1}),
    body('sendTime').exists().isISO8601(),
    body('membersPhoneNumber').exists().isArray({min: 2}),
    controller.sendMessage
)

router.post(
    '/send-messages-seen-info',
    loginRequired,
    body('seenTime').exists().isISO8601(),
    body('roomId').exists().isString().isLength({min: 1}),
    controller.sendMessagesSeenInfo
)


module.exports = router