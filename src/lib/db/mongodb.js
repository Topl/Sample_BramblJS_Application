/* eslint-disable no-console */

const glob = require("glob");
const mongoose = require("mongoose");
const settings = require("./mongoDBSettings");

const clientOption = {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
};

const uri = settings.mongoURI;

// search for all models defined in modules and create the needed collections
// this is required for atomic transactions
const ensureCollections = async () => {
    glob.sync("**/*.model.js", { cwd: `${process.cwd()}/src/modules` })
        .map((filename) => require(`../../modules/${filename}`))
        .forEach((model) => model.createCollection());
};

var connectWithRetry = function () {
    return mongoose.connect(uri, clientOption, function (err) {
        if (err) {
            console.error("Failed to connect to mongo on startup - retrying in one second", err);
            setTimeout(connectWithRetry, 1000);
        }
    });
};

async function doesCollectionExist(collectionName) {
    let obj = {};
    return connectionIsUp().then(function (result) {
        if (result) {
            try {
                const collectionsQueryResult = mongoose.connection.db.listCollections({
                    name: collectionName,
                });
                if (collectionsQueryResult) {
                    obj.result = true;
                    console.log(`Collection ${collectionName} found`);
                    return obj;
                } else {
                    console.error(`Collection ${collectionName} not found`);
                    obj.error = "Collection not found";
                    return obj;
                }
            } catch (error) {
                console.error(error);
                obj.error = error;
                return obj;
            }
        } else {
            console.error("Sample BramblJS Application is not connected to the DB. Please try again later");
            obj.error = "Sample BramblJS Application is not connected to the DB. Please try again later";
            return obj;
        }
    });
}

async function connectionIsUp() {
    try {
        return mongoose.connection.readyState === 1;
    } catch (err) {
        return false;
    }
}

module.exports = async () => {
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

module.exports.connectionIsUp = connectionIsUp;
module.exports.doesCollectionExist = doesCollectionExist;
