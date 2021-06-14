const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')

const User = require('../models/user')
const Constant = require('../constant')
const connections = require('../cache')
const socket = require('../socket')
const fcm = require('../fcm_manager')

exports.createUser = async (req, res, next) => {
    const validationErrors = validationResult(req)
    let user;
    if(!validationErrors.isEmpty()){
        if(req.file){
            fs.unlink(req.file.path, () => {})
        }
        return res.json({
            success: false,
            message: validationErrors
        })
    }

    try{
        const phoneNumber = req.body.phoneNumber.replace(Constant.clearPhoneNumberRegex, '').slice(-10)
        const name = req.body.name
        const haveProfilePicture = req.body.haveProfilePicture
        const fcmToken = req.body.fcmToken

        const registeredUser = await User.findOne({ phoneNumber: phoneNumber })

        if(registeredUser != null){
            return res.json({
                success: false,
                message: 'User is already registered'
            })
        }

        user = new User({
            name,
            phoneNumber,
            contacts: [],
            haveProfilePicture,
            fcmToken
        })

        const response = await user.save()

        if(haveProfilePicture.toLowerCase() === 'true'){
            const filePath = path.join(__dirname, '..', 'images', `${phoneNumber}_profile_picture`);
            fs.rename(req.file.path, filePath, () => {})
        }

        const token = response.login()

        res.status(201).json({
            success: true,
            token,
            id: response._id
        })

    }
    catch (e){
        if(req.file){
            fs.unlink(req.file.path, () => {})
        }
        if(user) {
            user.remove()
        }
        console.log(e)
        res.status(500).json({
            success: false
        })
    }
}

exports.login = async (req, res, next) => {
    const validationErrors = validationResult(req)

    if(!validationErrors.isEmpty()){
        return res.json({
            success: false,
            message: validationErrors
        })
    }

    try{
        const phoneNumber = req.body.phoneNumber.replace(Constant.clearPhoneNumberRegex, '').slice(-10)
        const fcmToken = req.body.fcmToken
        const user = await User.findOne({ phoneNumber: phoneNumber})

        if(!user){
            return res.status(404).json({
                success: false,
                message: 'Not found'
            })
        }

        const token = user.login()
        let profilePicture

        if(user.haveProfilePicture){
            const filePath = path.join(__dirname, '..', 'images', `${user.phoneNumber}_profile_picture`);
            profilePicture = fs.readFileSync(filePath).toJSON().data
        }

        user.lastSeen = null;
        user.fcmToken = fcmToken
        user.save()

        res.json({
            success: true,
            token: token,
            "user": {
                haveProfilePicture: user.haveProfilePicture,
                profilePicture: profilePicture,
                name: user.name,
                about: user.about,
                showLastSeen: user.showLastSeen,
                id: user._id,
            }
        })
    }
    catch (e){
        console.log(e)
        res.status(500).json({
            success: false
        })
    }
}

exports.uploadProfilePicture = async (req, res, next) => {
    console.log('inn')
    res.json({
        success: true
    })
}

exports.checkAndUpdateContactList = async (req, res, next) => {
    try{
        const validationErrors = validationResult(req)

        if(!validationErrors.isEmpty()){
            return res.json({
                success: false,
                message: validationErrors
            })
        }
        const newContactsPhoneNumber = req.body.newContactsPhoneNumber
        const removedContactsPhoneNumber = req.body.removedContactsPhoneNumber

        let registeredUsers = await User.find({phoneNumber: { $in: newContactsPhoneNumber}}).select('phoneNumber about haveProfilePicture -_id')
        const registeredUsersPhoneNumber = registeredUsers ? registeredUsers.map(user => user.phoneNumber) : []
        const user = await User.findById(req.userId)

        const userContacts = user.contacts;

        const userContactsReduced = userContacts.filter(number => !removedContactsPhoneNumber.includes(number))

        user.contacts = userContactsReduced.concat(registeredUsersPhoneNumber)

        user.save()

        registeredUsers = registeredUsers.map(user => {
            if(user.haveProfilePicture){
                const filePath = path.join(__dirname, '..', 'images', `${user.phoneNumber}_profile_picture`);
                return {...user.toObject(), 'profilePicture': fs.readFileSync(filePath).toJSON().data}
            }
            return {...user.toObject()}
        })

        res.json({
            success: true,
            registeredUsers
        })
    }
    catch (e) {
        console.log(e)
        res.status(500).json({
            success: false,
        })
    }
}

exports.getUnListedContactData = async (req, res, next) => {
    const validationErrors = validationResult(req)

    if(!validationErrors.isEmpty()){
        return res.json({
            success: false,
            message: validationErrors
        })
    }

    const phoneNumber = req.query.phoneNumber
    const from = req.query.from
    let profilePicture;

    const user = await User.findOne({phoneNumber: phoneNumber})

    if(!user){
        return res.json({
            success: false,
        })
    }

    if(user.haveProfilePicture){
        const filePath = path.join(__dirname, '..', 'images', `${user.phoneNumber}_profile_picture`);
        profilePicture = fs.readFileSync(filePath).toJSON().data
    }

    res.json({
        success: true,
        'about': user.about,
        'haveProfilePicture': user.haveProfilePicture,
        'profilePicture': profilePicture,
    })
}

exports.checkContactStatus = async (req, res, next) => {
    const validationErrors = validationResult(req)

    if(!validationErrors.isEmpty()){
        return res.json({
            success: false,
            message: validationErrors
        })
    }

    const phoneNumber = req.query.phoneNumber
    const userPhoneNumber = req.query.userPhoneNumber

    if(userPhoneNumber !== req.userPhoneNumber){
        return res.json({
            success: false,
        })
    }

    const user = await User.findOne({phoneNumber: phoneNumber})

    if(!user){
        return res.json({
            success: false,
        })
    }

    res.json({
        success: true,
        'isOnline': user.lastSeenTime === null,
        'lastSeenTime': user.lastSeenTime,
    })
}

exports.disconnect = async (req, res, next) => {
    const userPhoneNumber = req.userPhoneNumber

    const user = await User.findOne({ phoneNumber: userPhoneNumber})

    if(!user){
        return res.json({
            success: false
        })
    }

    user.lastSeenTime = Date.now()
    user.save()

    const payload = {
        data: {
            'isOnline': "false",
            'lastSeenTime': user.lastSeenTime.toISOString()
        }
    }
    const topic = `status-channel-${userPhoneNumber}`

    fcm.sendMessageToTopic(payload, topic)

}

exports.connect = async (req, res, next) => {
    const phoneNumber = req.body.phoneNumber
    const user = await User.findOne({phoneNumber: phoneNumber}).exec()

    user.lastSeenTime = null;
    user.save()

    const payload = {
        data: {
            'isOnline': "true",
        }
    }
    const topic = `status-channel-${phoneNumber}`

    fcm.sendMessageToTopic(payload, topic)

    res.json({
        success: true
    })
}