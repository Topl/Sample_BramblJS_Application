// Clean for easy coupling and decoupling of components, so routes and our BramblJS functionality will be put in other files. 
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import logger from "morgan";
import addresses from "./app/routes/addresses.route.mjs";
import users from "./app/routes/users.route.mjs";

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'app/views'))
app.set('view engine', 'ejs')

app.use(cors());
process.env.NODE_ENV !== "prod" && app.use(morgan("dev"));

// middleware that parses requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(logger('dev'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')))

// Register api routes
app.use("/api/v1/assets", addresses);
app.use("/api/v1/user", users);
app.use("/status", express.static("build"));
app.use("/", express.static("build"));
app.use("*", (req, res) => res.status(404).json({ error: "not found" }));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    //only provide error in dev
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // TODO create error page
})

export default app;
