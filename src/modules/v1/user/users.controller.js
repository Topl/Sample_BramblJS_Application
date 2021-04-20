const stdRoute = require("../../../core/standardRoute")
const UserService = require(`./users.service`);

class UserController{
    static async register(req, res) {
            const handler = UserService.addUser;

            const args = {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email
            };

            const responseMsg = {success: "User Created!"};
            stdRoute(req, res, handler, args, responseMsg);
    }

    static async delete(req, res) {
        const handler = UserService.deleteUser;
        const args = {
            email: req.body.email
        }
        const responseMsg = {success: "User Deleted!"};
        stdRoute(req, res, handler, args, responseMsg);
    }

    static async save(req, res) {

            const handler = UsersService.updateUser;

            const args = {
                user_id: req.body.email,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
            };

            const responseMsg = {success: "Updated User Information!"};
            stdRoute(req, res, handler, args, responseMsg);
        
    }

    // for internal use only
    // static async createAdminUser(req, res) {
    //     try {
    //         const userFromBody = req.body
    //         let errors = {}
    //         if (userFromBody && userFromBody.password.length < 8) {
    //             errors.password = "Your password must be at least 8 characters."
    //         }
    //         if (userFromBody && userFromBody.name.length < 3) {
    //             errors.name = "You must specify a name of at least 3 characters."
    //         }

    //         if (Object.keys(errors).length > 0) {
    //             res.status(400).json(errors)
    //             return
    //         }

    //         const userInfo = {
    //             ...userFromBody, 
    //             password: await hashPassword(userFromBody.password),
    //         }

    //         const adminResult = await UsersService.makeAdmin(userInfo)
    //         if (!adminResult.success) {
    //             errors.email = insertResult.error
    //         }

    //         res.json({
    //             auth_token: adminResult.user.encoded(),
    //             info: adminResult.user.toJson(),
    //         })
    //     } catch (e) {
    //         res.status(500).json(e)
    //     }
    // }
}

module.exports = UserController, User