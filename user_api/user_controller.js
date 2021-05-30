const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
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
        const contacts = req.body.contacts

        const registeredUser = await User.findOne({ phoneNumber: phoneNumber })

        if(registeredUser != null){
            return res.json({
                success: false,
                message: 'User is already registered'
            })
        }

        const registeredContacts = await User.find({
            phoneNumber: {$in: contacts}
        })

        const registeredContactsPhoneNumber = registeredContacts.map(user => user.phoneNumber)

        const user = new User({
            name,
            phoneNumber,
            contacts: registeredContactsPhoneNumber
        })

        const response = await user.save()

        res.status(201).json({
            success: true,
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