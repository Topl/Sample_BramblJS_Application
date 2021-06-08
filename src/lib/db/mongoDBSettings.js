const mongoDBSettings = require("../../../config/mongoDBSettings.json");
require("dotenv").config();

const settings = {
  mongoURI:
    process.env.DOCKER === "true"
      ? mongoDBSettings.dockerMongoURI
      : mongoDBSettings.localMongoURI,
  port: mongoDBSettings.port || process.env.PORT,
};

module.exports = settings;
