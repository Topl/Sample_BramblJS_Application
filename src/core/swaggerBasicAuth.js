const settings = require("../lib/db/mongoDBSettings");

module.exports = async (req, res, next) => {
    const auth = { login: settings.swaggerUser, password: settings.swaggerPass };

    //parse login and password from headers
    const b64auth = (req.headers.authorization || "").split(" ")[1] || "";
    const [login, password] = Buffer.from(b64auth, "base64").toString().split(":");

    // Verify login and password are set and correct
    if (login && password && login === auth.login && password === auth.password) {
        //Access granted...
        return next();
    }

    // Access denied...
    res.set("WWW-Authenticate", 'Basic realm="401"'); // challenge
    res.status(401).send("Authentication required.");
};
