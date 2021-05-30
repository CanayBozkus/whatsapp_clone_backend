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
    }
}