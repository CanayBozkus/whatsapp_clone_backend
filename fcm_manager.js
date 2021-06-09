const admin = require("firebase-admin");

const serviceAccount = require('./firebase-adminsdk.json');

module.exports = {
    init(){
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    },

    async sendMessageToDevice(payload, deviceToken){
        const messaging = admin.messaging()

        const response = await messaging.sendToDevice(deviceToken, payload)
        return response
    }
}