require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

const userAPIRoutes = require('./user_api/user_route')

const MONGODB_URI = process.env.MONGODB_URI
const port = process.env.PORT

const app = express()

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(userAPIRoutes)

app.get('/test', (req, res, next) => {
    console.log('test')
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
            const authorizationJwtToken = socket.handshake.headers.authorization.split(' ')[1]

            console.log(`Client connected ${socket.id}`)
        })
    })