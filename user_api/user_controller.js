const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')

const User = require('../models/user')
const Constant = require('../constant')
const connections = require('../cache')
const socket = require('../socket')

exports.createUser = async (req, res, next) => {
    const validationErrors = validationResult(req)

    if(!validationErrors.isEmpty()){
        return res.json({
            success: false,
            message: validationErrors
        })
    }

    try{
        const phoneNumber = req.body.phoneNumber.replace(Constant.clearPhoneNumberRegex, '').slice(-10)
        const name = req.body.name
        const haveProfilePicture = req.body.haveProfilePicture
        const profilePicture = req.body.profilePicture

        const registeredUser = await User.findOne({ phoneNumber: phoneNumber })

        if(registeredUser != null){
            return res.json({
                success: false,
                message: 'User is already registered'
            })
        }

        const user = new User({
            name,
            phoneNumber,
            contacts: [],
            haveProfilePicture
        })

        const response = await user.save()

        if(haveProfilePicture){
            const filePath = path.join(__dirname, '..', 'images', `${phoneNumber}_profile_picture`);
            return fs.writeFile(filePath, Buffer.from(profilePicture), (err)=>{
                if(err){
                    console.log(err)
                    user.remove()
                    return res.status(500).json({
                        success: false,
                    })
                }

                const token = jwt.sign(
                    {
                        random: Math.floor(Math.random() * 1000),
                        name: response.name,
                        phoneNumber: response.phoneNumber,
                        id: response._id,
                        createdDate: Date.now()*Math.random()
                    },
                    process.env.JWT_SECRET_KEY
                )
                res.status(201).json({
                    success: true,
                    token,
                    id: response._id
                })
            })
        }

        const token = jwt.sign(
            {
                random: Math.floor(Math.random() * 1000),
                name: response.name,
                phoneNumber: response.phoneNumber,
                id: response._id,
                createdDate: Date.now()*Math.random()
            },
            process.env.JWT_SECRET_KEY
        )
        res.status(201).json({
            success: true,
            token,
            id: response._id
        })

    }
    catch (e){
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

        const user = await User.findOne({ phoneNumber: phoneNumber})

        if(!user){
            return res.status(404).json({
                success: false,
                message: 'Not found'
            })
        }

        const token = jwt.sign(
            {
                random: Math.floor(Math.random() * 1000),
                name: user.name,
                phoneNumber: user.phoneNumber,
                id: user._id,
                createdDate: Date.now()*Math.random()
            },
            process.env.JWT_SECRET_KEY
        )

        user.lastSeen = null;
        await user.save()

        res.json({
            success: true,
            token: token
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
        'isOnline': Object.keys(connections).includes(phoneNumber),
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

    delete connections[userPhoneNumber]

    socket.getIO().emit(`${userPhoneNumber}-status-channel`, {
        'isOnline': false,
        'lastSeenTime': user.lastSeenTime.toISOString()
    })
}