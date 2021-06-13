class Constant {
    showLastSeenTypes = {
        0: 'everyone',
        1: 'contacts',
        2: 'nobody'
    }

    showLastSeenTypesReverse = {
        'everyone' : 0,
        'contacts' : 1,
        'nobody': 2
    }

    clearPhoneNumberRegex = /[A-Za-z\*()\s#\.,\+\/\;-]/g

    fcmType = {
        'message': 0,
        'message_seen': 1,
        'message_received': 2
    }
}

module.exports = new Constant()