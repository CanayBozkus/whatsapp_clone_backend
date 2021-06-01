const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')

const User = require('../models/user')
const Constant = require('./constant')

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
        const profilePictureName = req.body.profilePictureName
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
            profilePictureName
        })

        const response = await user.save()

        const filePath = path.join(__dirname, '..', 'images', profilePictureName);
        fs.writeFile(filePath, Buffer.from(profilePicture), (err)=>{
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
                contacts: registeredContactsPhoneNumber,
                id: response._id
            })
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

exports.checkIfNewContactsRegistered = async (req, res, next) => {
    const validationErrors = validationResult(req)

    if(!validationErrors.isEmpty()){
        return res.json({
            success: false,
            message: validationErrors
        })
    }
    const newContactsPhoneNumber = req.body.newContactsPhoneNumber

    const registeredUsers = await User.find({phoneNumber: { $in: newContactsPhoneNumber}}).select('phoneNumber about -_id')

    console.log(registeredUsers)
    res.json({
        success: true,
        registeredUsers
    })
}