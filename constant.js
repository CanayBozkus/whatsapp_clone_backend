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
}

module.exports = new Constant()