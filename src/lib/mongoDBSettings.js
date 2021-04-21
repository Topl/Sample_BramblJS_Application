const mongoDBSettings = require("../../config/mongoDBSettings.json");
require("dotenv").config();

const settings = {
  mongoURI: process.env.MONGO_URI || mongoDBSettings.mongoURI,
  port: process.env.PORT || mongoDBSettings.port
};

module.exports = settings;
