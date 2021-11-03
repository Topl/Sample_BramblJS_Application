const mongoDBSettings = require("../../../config/mongoDBSettings.json");
const isDocker = require("is-docker");
require("dotenv").config();

const settings = {
    mongoURI: isDocker() ? mongoDBSettings.dockerMongoURI : mongoDBSettings.localMongoURI,
    port: mongoDBSettings.port || process.env.PORT,
};

module.exports = settings;
