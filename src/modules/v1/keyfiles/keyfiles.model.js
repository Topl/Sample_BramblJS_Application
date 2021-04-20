const mongoose = require('mongoose')

const KeyfileSchema = new mongoose.Schema({
    address_id: {
        type: String,
        required: false,
    },
    address: {
        type: String,
        required: true,
    },
    user_id: {
        type: String,
        required: true,
    },
    network: {
        type: String,
        required: true,
    },
    keyfile: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        address: {
            type: String,
            required: true,
        },
        crypto: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
            mac: {
                type: String,
                required: true,
            },
            kdf: {
                type: String,
                required: true,
            },
            cipherText: {
                type: String,
                required: true,
            },
            kdfSalt: {
                type: String,
                required: true,
            },
            cipher: {
                type: String,
                required: true,
            },
            cipherParams: {
                type: mongoose.Schema.Types.Mixed,
                required: true,
                iv: {
                    type: String,
                    required: true,
                }
            }
        }
    },
    dateCreated: {type: Date, default: Date.now},
    lastUpdate: {type: Date, default: Date.now},
    isActive: {
        type: mongoose.Schema.Types.Mixed,
        status: {
            type: Boolean,
            default: true,
        },
        asOf: {
            type: Date,
        },
        required: true,
    }
})

//eslint-disable-next-line no-undef
module.exports = Keyfile = mongoose.model('keyfile', KeyfileSchema)