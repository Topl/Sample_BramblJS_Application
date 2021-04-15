const mongoose = require('mongoose')

const AddressSchema = new mongoose.Schema({
    _id: String, 
    address: String,
    title: String,
    lastUpdatedDate: {type: Date, default: Date.now},
    polyBalance: Number,
    user_id: Array,
    trustRating: Array,
    keyfileId: String
})

// eslint-disable-next-line no-undef
module.exports = Address = mongoose.model('address', AddressSchema)