require('dotenv').config()

const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization')

    if(!authHeader){
        return res.status(401).json({
            success: false,
            message: "Login Required",
        })
    }

    const token = authHeader.split(' ')[1]
    let decodedToken

    try{
        decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY)
    }

    catch(e){
        return res.status(401).json({
            success: false,
            message: 'Invalid token',
        })
    }

    req.userId = decodedToken.id
    req.userPhoneNumber = decodedToken.phoneNumber
    next()
}