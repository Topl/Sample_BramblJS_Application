const mongoose = require('mongoose')

/**
 * The Schema for a session
 * @param {string} email - the email of the user 
 * @param {string} jwt - A JSON web token representing the user's claims
 */
const SessionsSchema = new mongoose.Schema({
    _id: String,
    email: String,
    jwt: String
})

// eslint-disable-next-line no-undef
module.exports = Sessions = mongoose.model('sessions', SessionsSchema)