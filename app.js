require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')

const userAPIRoutes = require('./user_api/user_route')

const MONGODB_URI = process.env.MONGODB_URI
const port = process.env.PORT

const app = express()

app.use(bodyParser({limit: '5mb'}));
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(userAPIRoutes)

app.get('/test', (req, res, next) => {
    res.json({
        success: true,
    })
})

mongoose
    .connect(MONGODB_URI)
    .then(result => {
        const server = app.listen(port, () => {
            console.log('Listening port 3000')
        })
        const io = require('./socket').init(server)

        io.on('connection', socket => {

            const authorizationHeader = socket.handshake.headers.authorization

            if(!authorizationHeader){
                io.sockets.connected[socket.id].disconnect();
                console.log('disconnected');
                return;
            }

            const token = authorizationHeader.split(' ')[1];

            try{
                jwt.verify(token, process.env.JWT_SECRET_KEY)
            }

            catch(e){
                console.log('disconnected');
                return io.sockets.connected[socket.id].disconnect();
            }
            console.log(`Client connected ${socket.id}`)
        })
    })