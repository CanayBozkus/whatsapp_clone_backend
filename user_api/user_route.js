const express = require('express')
const { body } = require('express-validator');

const controller = require('./user_controller')
const loginRequired = require('../middleware/login_required')
const Constant = require('./constant')

const router = express.Router()

router.post(
    '/create-user',
    body('phoneNumber')
        .notEmpty()
        .withMessage('Phone number is required')
        .replace(Constant.clearPhoneNumberRegex, '')
        .isLength({min: 10})
        .withMessage('Invalid phone number'),
    body('name').isLength({min: 1}).withMessage('Name is required'),
    body('contacts').isArray(),
    body('profilePhoto').exists(),
    controller.createUser
)

router.post(
    '/login',
    body('phoneNumber')
        .notEmpty()
        .withMessage('Phone number is required')
        .replace(Constant.clearPhoneNumberRegex, '')
        .isLength({min: 10})
        .withMessage('Invalid phone number'),
    controller.login
)

module.exports = router