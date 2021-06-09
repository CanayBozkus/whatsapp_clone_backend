const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const Schema = mongoose.Schema

const userModel = new Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
    },
    lastSeenTime: {
        type: Date,
        default: null
    },
    showLastSeen: {
        type: Number,
        default: 0
    },
    contacts: [
        {
            type: String,
        }
    ],
    about: {
        type: String,
        default: 'Hey there, I am new on WhatsApp.'
    },
    haveProfilePicture: {
        type: Boolean,
        default: false
    },
    fcmToken: {
        type: String,
        required: true,
    }
})

userModel.methods.login = function (){
    const token = jwt.sign(
        {
            random: Math.floor(Math.random() * 1000),
            name: this.name,
            phoneNumber: this.phoneNumber,
            id: this._id,
            createdDate: Date.now()*Math.random()
        },
        process.env.JWT_SECRET_KEY
    )

    return token
}

module.exports = mongoose.model('User', userModel)