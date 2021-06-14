const express = require('express')
const { body, query } = require('express-validator');

const controller = require('./user_controller')
const loginRequired = require('../middleware/login_required')
const Constant = require('../constant')
const fileManager = require('../file_manager')

const router = express.Router()

router.post(
    '/create-user',
    fileManager.single('profilePicture'),
    body('phoneNumber')
        .notEmpty()
        .withMessage('Phone number is required')
        .replace(Constant.clearPhoneNumberRegex, '')
        .isLength({min: 10})
        .withMessage('Invalid phone number'),
    body('name').isLength({min: 1}).withMessage('Name is required'),
    body('haveProfilePicture')
        .exists()
        .isBoolean(),
    body('fcmToken').exists().isString().isLength({min: 1}),
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
    body('fcmToken').exists().isString().isLength({min: 1}),
    controller.login
)

router.post(
    '/upload-profile-picture',
    fileManager.single('image'),
    controller.uploadProfilePicture
)

router.post(
    '/check-and-update-contact-list',
    loginRequired,
    body('newContactsPhoneNumber').isArray({min: 1}),
    body('removedContactsPhoneNumber').exists().isArray(),
    controller.checkAndUpdateContactList
)

router.get(
    '/get-unlisted-contact-data',
    query('phoneNumber')
        .notEmpty()
        .withMessage('Phone number is required')
        .replace(Constant.clearPhoneNumberRegex, '')
        .isLength({min: 10})
        .withMessage('Invalid phone number'),
    query('from')
        .notEmpty()
        .withMessage('Phone number is required')
        .replace(Constant.clearPhoneNumberRegex, '')
        .isLength({min: 10})
        .withMessage('Invalid phone number'),
    controller.getUnListedContactData
)

router.get(
    '/check-contact-status',
    loginRequired,
    query('phoneNumber')
        .notEmpty()
        .withMessage('Phone number is required')
        .replace(Constant.clearPhoneNumberRegex, '')
        .isLength({min: 10})
        .withMessage('Invalid phone number'),
    query('userPhoneNumber')
        .notEmpty()
        .withMessage('Phone number is required')
        .replace(Constant.clearPhoneNumberRegex, '')
        .isLength({min: 10})
        .withMessage('Invalid phone number'),
    controller.checkContactStatus
)

router.post(
    '/disconnect',
    loginRequired,
    controller.disconnect
)

router.post(
    '/connect',
    loginRequired,
    controller.connect
)

module.exports = router