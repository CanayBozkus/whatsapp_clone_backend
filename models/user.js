const mongoose = require('mongoose')

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
    }
})

module.exports = mongoose.model('User', userModel)