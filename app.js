require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

const userAPIRoutes = require('./user_api/user_route')
const messageAPIRoutes = require('./message_api/message_route')

const MONGODB_URI = process.env.MONGODB_URI
const port = process.env.PORT

const app = express()

app.use(bodyParser({limit: '5mb'}));
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(userAPIRoutes)
app.use(messageAPIRoutes)

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
        const socket = require('./socket')
        const io = socket.init(server)

        io.on('connection', socket.connectionHandler)
    })