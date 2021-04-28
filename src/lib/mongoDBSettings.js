const mongoDBSettings = require("../../config/mongoDBSettings.json");
require("dotenv").config();

const settings = {
  mongoURI: mongoDBSettings.mongoURI || process.env.MONGO_URI,
  port: mongoDBSettings.port || process.env.PORT
};

module.exports = settings;
