const User = require("../modules/v1/user/user.model");
const { checkExists } = require("../lib/validation");

module.exports = async (req, res, next) => {
    // Checking that user_id was sent
    if (!req.body.user_id) {
        return res.status(401).json({ errors: [{ msg: "User Id is missing." }] });
    }
    try {
        const userId = req.body.user_id;
        const fetchedUser = await checkExists(User, userId, "email");
        if (!fetchedUser.doc || fetchedUser.doc.isActive == false) {
            throw new Error("User not found");
        }
        next();
    } catch (err) {
        console.error(err);
        res.status(403).json({
            errors: [
                {
                    msg: "An error occurred while verifying your email. Please provide a valid email.",
                },
            ],
        });
    }
};
