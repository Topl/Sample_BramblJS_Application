const mongoose = require('mongoose')

const KeyfileSchema = new mongoose.Schema({
    _id: String,
    address_id: String,
    user_id: String,
    keyfile: {
        address: String,
        crypto: {
            mac: String,
            kdf: String,
            cipherText: String,
            kdfSalt: String,
            cipher: String,
            cipherParams: {
                iv: String
            }
        }
    },
    lastUpdatedDate: {type: Date, default: Date.now},
})

//eslint-disable-next-line no-undef
module.exports = Keyfile = mongoose.model('keyfile', KeyfileSchema)