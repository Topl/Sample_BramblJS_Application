const mongoDBSettings = require('../../config/connections.json')

const settings = {
    mongoURI: process.env.MONGO_URI || mongoDBSettings.mongoURI,
    port: process.env.PORT || mongoDBSettings.port
}

module.exports = settings