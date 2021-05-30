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
    profilePictureName: {
        type: String,
        default: null
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
    ]
})

module.exports = mongoose.model('User', userModel)