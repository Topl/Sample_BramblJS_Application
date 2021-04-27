/* eslint-disable no-console */

const glob = require("glob");
const mongoose = require("mongoose");
const settings = require("./mongoDBSettings");

const clientOption = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
};

const uri = settings.mongoURI;

// search for all models defined in modules and create the needed collections
// this is required for atomic transactions
const ensureCollections = () => {
  glob
    .sync("**/*.model.js", { cwd: `${process.cwd()}/src/modules` })
    .map(filename => require(`../modules/${filename}`))
    .forEach(model => model.createCollection());
};

module.exports = async () => {
  mongoose.connect(uri, clientOption);

  mongoose.connection.on("connected", function() {
    ensureCollections();
    console.log("Mongoose connected to mongodb!");
  });

  mongoose.connection.once("open", () => {
    console.log("Connection now open");
  });

  mongoose.connection.on("error", function(err) {
    console.error("Mongoose default error: " + err);
  });

  mongoose.connection.on("disconnected", function() {
    console.log("Mongoose default connection disconnected");
  });
};
