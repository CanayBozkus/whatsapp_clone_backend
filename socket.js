const connections = require('./cache')

let io

module.exports = {
    init: server => {
        io = require('socket.io')(server, { cors: {origin: "*"}})
        return io
    },
    getIO: () => {
        if(!io){
            throw new Error('IO not initialized')
        }
        return io
    },
    connectionHandler: (socket) => {
        const jwt = require('jsonwebtoken')

        const authorizationHeader = socket.handshake.headers.authorization

        if(!authorizationHeader){
            io.sockets.connected[socket.id].disconnect();
            console.log('disconnected');
            return;
        }

        const token = authorizationHeader.split(' ')[1];
        let decodedToken;
        try{
            decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY)
        }

        catch(e){
            console.log('disconnected');
            return io.sockets.connected[socket.id].disconnect();
        }

        connections[decodedToken['phoneNumber']] = socket.id
        console.log(`Client connected ${socket.id}`)
    },
}