// Clean for easy coupling and decoupling of components, so routes and our BramblJS functionality will be put in other files.
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";
import addresses from "../src/api/addresses.route.mjs";
import users from "../src/api/users.route.mjs";

const app = express();

app.use(cors());
process.env.NODE_ENV !== "prod" && app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Register api routes
app.use("/api/v1/assets", addresses);
app.use("/api/v1/user", users);
app.use("/status", express.static("build"));
app.use("/", express.static("build"));
app.use("*", (req, res) => res.status(404).json({ error: "not found" }));

export default app;
