const stdRoute = require("../../../core/standardRoute");
const UserService = require(`./users.service`);

class UserController {
  static async register(req, res, next) {
    const handler = UserService.addUser;

    const args = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email
    };

    const responseMsg = { success: "User Created!" };
    stdRoute(req, res, next, handler, args, responseMsg);
  }

  static async getUser(req, res, next) {
    const handler = UserService.getUser;
    const args = {
      requestedEmail: req.body.requestedEmail,
      userEmail: req.query.email
    };

    const responseMsg = { success: "User Retrieved" };
    stdRoute(req, res, next, handler, args, responseMsg);
  }

  static async delete(req, res, next) {
    const handler = UserService.deleteUser;
    const args = {
      requestedEmail: req.body.requestedEmail,
      userEmail: req.query.user_id
    };
    const responseMsg = { success: "User Deleted!" };
    stdRoute(req, res, next, handler, args, responseMsg);
  }

  static async save(req, res, next) {
    const handler = UserService.updateUser;

    const args = {
      user_id: req.body.user_id,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      newEmail: req.body.newEmail,
      changeEmail: req.body.email
    };

    const responseMsg = { success: "Updated User Information!" };
    stdRoute(req, res, next, handler, args, responseMsg);
  }
}

module.exports = UserController;
