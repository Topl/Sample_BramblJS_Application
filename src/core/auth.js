const settings = require("../lib/mongoDBSettings");
const User = require('../modules/v1/user/user.model');
const UserService = require('../modules/v1/user/users.service');

module.exports = async(req, res, next) => {

    try {
        const userId = req.body.email;
        args = {
            email: userId
        };
        const fetchedUser = await UserService.getUser(args);
        if (!fetchedUser || fetchedUser.isActive == false) {
            throw new Error('User not found');
        }
        next();
    } catch (err) {
        console.error(err);
        res.status(403).json({
            errors: [
                {msg: 'An error occurred while verifying your token. Please provide a valid token with your request. '}
            ]
        });
    }
}