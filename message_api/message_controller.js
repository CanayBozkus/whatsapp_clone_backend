const { validationResult } = require('express-validator')
const User = require('../models/user')
const connections = require('../cache')
const socket = require('../socket')
const fcm = require('../fcm_manager')
const Constant = require('../constant')

exports.sendMessage = async (req, res, next) => {
    const validationErrors = validationResult(req)

    if(!validationErrors.isEmpty()){
        return res.json({
            success: false,
            message: validationErrors
        })
    }

    const message = req.body.message
    let membersPhoneNumber
    try {
         membersPhoneNumber = JSON.parse(req.body.membersPhoneNumber.toString())
    }
    catch (e) {
         membersPhoneNumber = req.body.membersPhoneNumber
    }
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
            notification: {
                title: fromUser,
                body: message
            },
            data: {
                type: Constant.fcmType['message'].toString(),
                message: message,
                fromUser: fromUser,
                roomId: roomId,
                sendTime: sendTimeString,
                click_action: "action"
            },
        }
        fcm.sendMessageToDevice(fcmMessage, fcmToken)
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

    const users = await User.find({phoneNumber: {$in: membersPhoneNumber}})

    users.forEach(user => {
        if(user.phoneNumber === req.userPhoneNumber) return
        const fcmToken = user.fcmToken
        const fcmMessage = {
            data: {
                type: Constant.fcmType['message_seen'].toString(),
                seenTime: seenTime,
                roomId: roomId,
                click_action: "action"
            },
        }
        fcm.sendMessageToDevice(fcmMessage, fcmToken)
    })

    res.json({
        success: true
    })
}

exports.sendMessageReceivedInfo = async (req, res, next) => {
    const validationErrors = validationResult(req)

    if(!validationErrors.isEmpty()){
        return res.json({
            success: false,
            message: validationErrors
        })
    }

    const roomId = req.body.roomId
    const receivedTime = req.body.receivedTime
    const messageOwnerPhoneNumber = req.body.messageOwnerPhoneNumber
    const messageReceiverPhoneNumber = req.body.messageReceiverPhoneNumber

    const users = await User.find({phoneNumber: {$in: [messageOwnerPhoneNumber, messageReceiverPhoneNumber]}})

    if(users.length < 2){
        return res.json({
            success: false
        })
    }

    const messageOwner = users.filter(user => user.phoneNumber === messageOwnerPhoneNumber)[0]

    const fcmToken = messageOwner.fcmToken
    const payload = {
        data: {
            type: Constant.fcmType['message_received'].toString(),
            roomId: roomId,
            receivedTime: receivedTime,
            messageReceiverPhoneNumber: messageReceiverPhoneNumber
        }
    }

    fcm.sendMessageToDevice(payload, fcmToken)

    res.json({
        success: true
    })
}