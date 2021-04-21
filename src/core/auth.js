const settings = require("../lib/mongoDBSettings");
const User = require("../modules/v1/user/user.model");
const { checkExists } = require("../lib/validation");

const serviceName = "auth";

module.exports = async (req, res, next) => {
  try {
    const userId = req.body.user_id;
    const fetchedUser = await checkExists(User, userId, { serviceName });
    if (!fetchedUser || fetchedUser.isActive == false) {
      throw new Error("User not found");
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(403).json({
      errors: [
        {
          msg:
            "An error occurred while verifying your email. Please provide a valid email."
        }
      ]
    });
  }
};
