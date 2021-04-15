const settings = require("../lib/mongoDBSettings")
const User = require('../modules/v1/user/user.model')
const jwt = require('jsonwebtoken')

module.exports = async(req, res, next) => {
    // Checking that token was sent
    if (!req.header('Authorization')) {
        return res.status(401).json({errors: [{
            msg: 'Access token is missing. Please log in'
        }]})
    }

    // split token string
    const token = req.header("Authorization").
        split(' ')[1]
    if (!token) {
        return res.status(401).json({errors: [
            { msg: 'Access token is missing. Please log in'}
        ]})
    }

    try {
        const decoded = jwt.verify(token, settings.authSecret)
        req.user = decoded.user
        const fetchedUser = await User.findById(req.user._id)
        if (!fetchedUser || fetchedUser.isActive == false) {
            throw new Error('User has a valid token but has been dropped from the database before token expiration')
        }
        next()
    } catch (err) {
        console.error(err)
        res.status(403).json({
            errors: [
                {msg: 'An error occurred while verifying your token. Please provide a valid token with your request. '}
            ]
        })
    }
}