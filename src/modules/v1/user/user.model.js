const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String
})

// eslint-disable-next-line no-undef
module.exports = User = mongoose.model('user', UserSchema)