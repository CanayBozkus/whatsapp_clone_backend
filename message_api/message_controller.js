const { validationResult } = require('express-validator')
const User = require('../models/user')
const connections = require('../cache')
const socket = require('../socket')

exports.sendMessage = async (req, res, next) => {
    const validationErrors = validationResult(req)

    if(!validationErrors.isEmpty()){
        return res.json({
            success: false,
            message: validationErrors
        })
    }

    const message = req.body.message
    const to = req.body.to
    const roomId = req.body.roomId
    const sendTimeString = req.body.sendTime

    const toUser = await User.findOne({phoneNumber: to})

    if(!toUser){
        return res.json({
            success: false,
        })
    }

    const socketId = connections[to]

    socket.getIO().to(socketId).emit('message', {
        message,
        to,
        roomId,
        sendTime: sendTimeString
    })

    res.json({
        success: true
    })
}