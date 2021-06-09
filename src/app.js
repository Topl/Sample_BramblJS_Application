/* eslint-disable no-console */
"use strict";
// External App Dependencies
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");

// logging dependencies
const mongoose = require("mongoose");
var path = require("path");
var rfs = require("rotating-file-stream");

// Internal Dependencies
const addresses = require("./modules/v1/addresses/addresses.route");
const users = require("./modules/v1/user/users.route");
const network = require("./modules/v1/network.route");
const settings = require("./lib/db/mongoDBSettings");
const connectDB = require("./lib/db/mongodb");

// Initialization
//-------------------------------------------------------------------------------------//

// Make the application
const app = express();

// create a rotating write stream
const accessLogStream = rfs.createStream("access.log", {
    interval: "1d", //rotate daily
    path: path.join(__dirname, "../logs"),
});

// Application Bbehavior
//-------------------------------------------------------------------------------------

//define application middleware

// the verify function defines req.rawBody
app.use([
    express.json({
        verify: (req, res, buf) => {
            req.rawBody = buf;
        },
        extended: false,
    }),
    cors(),
    helmet(),
]);

//setup logging
// log only 4xx and 5xx responses to console
app.use(
    morgan("dev", {
        skip: (req, res) => {
            return res.statusCode < 400;
        },
    })
);

// log all requests to access.log
app.use(
    morgan("combined", {
        stream: accessLogStream,
    })
);

// Define server status
const serverStatus = () => {
    return {
        state: "up",
        dbState: mongoose.STATES[mongoose.connection.readyState],
    };
};

// view engine setup
app.set("views", path.join(__dirname, "app/views"));
app.set("view engine", "ejs");

// health-check middleware
app.use(
    "/api/uptime",
    require("express-healthcheck")({
        healthy: serverStatus,
    })
);

// Register api routes
app.use("/api/v1/addresses", addresses);
app.use("/api/v1/user", users);
app.use("/api/v2/", network);
app.use("/status", express.static("build"));
app.use("/", express.static("build"));
app.use("*", (req, res) => res.send("Server is working")); // test route - fall through

// Application Startup
//-------------------------------------------------------------------------------------
let server = {};
let agenda = null;

// Begin the database connection
connectDB().then(async () => {
    //Setup and start the app listening on the specified port
    server = app.listen(settings.port, () => {
        console.log("HTTP Server running on port " + settings.port);
    });
});

// Allow graceful shutdown
//-------------------------------------------------------------------------------------
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

function shutdown() {
    console.log("Exiting application process");

    server.close(async (err) => {
        // if error, log and exit with error (1) code
        if (err) {
            console.error(err);
            process.exit(1);
        }

        if (agenda) {
            await agenda.stop();
            console.log("Agenda Connection Terminated");
        }

        // close the database connection and exit with success (0 code)
        // for example with mongoose
        mongoose.connection.close(() => {
            console.log("Mongoose connection disconnected");
            process.exit(0);
        });
    });
}
