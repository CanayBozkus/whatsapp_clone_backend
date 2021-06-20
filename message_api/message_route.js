const express = require('express')
const { body } = require('express-validator');

const loginRequired = require('../middleware/login_required')
const controller = require('./message_controller')
const Constant = require('../constant')
const fileManager = require('../file_manager')

const router = express.Router()

router.post(
    '/send-message',
    loginRequired,
    fileManager.single('imageFile'),
    body('message')
        .exists()
        .isString()
        .custom((value, { req, location, path }) => {
            return req.body.haveFile ? true : value !== ''
        },),
    body('from')
        .notEmpty()
        .withMessage('From Phone number is required')
        .replace(Constant.clearPhoneNumberRegex, '')
        .isLength({min: 10})
        .withMessage('Invalid phone number'),
    body('roomId').exists().isString().isLength({min: 1}),
    body('sendTime').exists().isISO8601(),
    body('membersPhoneNumber')
        .exists()
        .custom((value, { req, location, path }) => {
            try {
                return JSON.parse(value.toString()).length >= 2
            }
            catch (e) {
                return value.length >= 2
            }
        },),
    controller.sendMessage
)

router.post(
    '/send-messages-seen-info',
    loginRequired,
    body('seenTime').exists().isISO8601(),
    body('roomId').exists().isString().isLength({min: 1}),
    controller.sendMessagesSeenInfo
)

router.post(
    '/send-messages-received-info',
    loginRequired,
    body('receivedTime').exists().isISO8601(),
    body('roomId').exists().isString().isLength({min: 1}),
    controller.sendMessageReceivedInfo
)


module.exports = router