const { validationResult } = require('express-validator')
const User = require('../models/user')
const connections = require('../cache')
const socket = require('../socket')
const fcm = require('../fcm_manager')

exports.sendMessage = async (req, res, next) => {
    const validationErrors = validationResult(req)

    if(!validationErrors.isEmpty()){
        return res.json({
            success: false,
            message: validationErrors
        })
    }

    const message = req.body.message
    const membersPhoneNumber = req.body.membersPhoneNumber
    const fromUser = req.body.from
    const roomId = req.body.roomId
    const sendTimeString = req.body.sendTime

    const users = await User.find({phoneNumber: {$in: membersPhoneNumber}})

    if(users.length !== 2){
        return res.json({
            success: false,
        })
    }

    /*
    membersPhoneNumber.forEach(phoneNumber => {
        if(phoneNumber === req.userPhoneNumber) return;
        const socketId = connections[phoneNumber]
        socket.getIO().to(socketId).emit('message', {
            message,
            from,
            roomId,
            sendTime: sendTimeString
        })
    })
    */

    users.forEach(user => {
        if(user.phoneNumber === req.userPhoneNumber) return
        const fcmToken = user.fcmToken
        const fcmMessage = {
            token: fcmToken,
            data: {
                message: message,
                fromUser: fromUser,
                roomId: roomId,
                sendTime: sendTimeString,
                click_action: "action"
            },
        }
        fcm.sendMessage(fcmMessage)
    })

    res.json({
        success: true
    })
}

exports.sendMessagesSeenInfo = async (req, res, next) => {
    const validationErrors = validationResult(req)

    if(!validationErrors.isEmpty()){
        return res.json({
            success: false,
            message: validationErrors
        })
    }

    const roomId = req.body.roomId
    const seenTime = req.body.seenTime
    const membersPhoneNumber = req.body.membersPhoneNumber

    membersPhoneNumber.forEach(phoneNumber => {
        if(phoneNumber === req.userPhoneNumber) return
        const socketId = connections[phoneNumber]
        console.log(socketId)
        socket.getIO().to(socketId).emit('message-seen', {
            seenTime,
            roomId,
        })
    })

    res.json({
        success: true
    })
}