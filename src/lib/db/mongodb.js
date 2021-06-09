/* eslint-disable no-console */

const glob = require("glob");
const settings = require("./mongoDBSettings");
const mongoose = require("mongoose");

const clientOption = {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: false,
};

const uri = settings.mongoURI;

// search for all models defined in modules and create the needed collections
// this is required for atomic transactions
const ensureCollections = async () => {
    glob.sync("**/*.model.js", { cwd: `${process.cwd()}/src/modules` }).map((filename) =>
        require(`../../modules/${filename}`)
    );
};

var connectWithRetry = function () {
    return mongoose.connect(uri, clientOption, function (err) {
        if (err) {
            console.error("Failed to connect to mongo on startup - retrying in one second", err);
            setTimeout(connectWithRetry, 1000);
        }
    });
};

function waitForMongooseConnection() {
    return new Promise((resolve) => {
        const connection = mongoose.connection;
        if (connection.readyState === 1) {
            resolve();
            return;
        }
        console.log("Mongoose connection is not ready. Waiting for open or reconnect event.");
        let resolved = false;
        const setResolved = () => {
            console.log("Mongoose connection became ready. Promise already resolved");
            if (!resolved) {
                console.log("resolving waitForMongooseConnection");
                resolved = true;
                resolve();
            }
        };
        connection.once("open", setResolved);
        connection.once("reconnect", setResolved);
    });
}

module.exports = async () => {
    mongoose.set("debug", true);
    connectWithRetry();

    await mongoose.connection.on("connected", function () {
        ensureCollections();
        console.log("Mongoose connected to mongodb!");
    });

    await mongoose.connection.once("open", () => {
        console.log("Connection now open");
    });

    mongoose.connection.on("error", function (err) {
        console.error("Mongoose default error: " + err);
    });

    mongoose.connection.on("disconnected", function () {
        console.log("Mongoose default connection disconnected");
    });
};

module.exports.waitForMongooseConnection = waitForMongooseConnection;
