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
    const from = req.body.from
    const roomId = req.body.roomId
    const sendTimeString = req.body.sendTime

    const users = await User.find({phoneNumber: {$in: [to, from]}})

    if(users.length !== 2){
        return res.json({
            success: false,
        })
    }

    const socketId = connections[to]

    socket.getIO().to(socketId).emit('message', {
        message,
        to,
        roomId,
        from,
        sendTime: sendTimeString
    })

    res.json({
        success: true
    })
}