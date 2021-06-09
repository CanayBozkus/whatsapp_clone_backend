const admin = require("firebase-admin");

const serviceAccount = require('./firebase-adminsdk.json');

module.exports = {
    init(){
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    },

    async sendMessage(payload){
        const messaging = admin.messaging()

        const response = await messaging.send(payload)
        return response
    }
}