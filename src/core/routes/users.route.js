const Router = require("express").Router;
const usersCtrl = require("../../modules/v1/user/users.controller");
const auth = require("../../core/auth");
const { checkSchema } = require("express-validator");

const router = new Router();

// associate put, delete, and get(id)
router.route("/register").post(
  checkSchema({
    firstName: {
      in: ["body"],
      optional: false,
      isString: true,
      errorMessage: "Please provide a valid first name"
    },
    lastName: {
      in: ["body"],
      optional: false,
      isString: true,
      errorMessage: "Please provide a valid last name"
    },
    email: {
      in: ["body"],
      optional: false,
      isEmail: true,
      errorMessage: "Please provide a valid email"
    }
  }),
  usersCtrl.register
);
router
  .route("/email")
  .delete(
    auth,
    checkSchema({
      email: {
        in: ["query"],
        optional: true,
        isEmail: true,
        errorMessage: "Please provide a valid email"
      },
      requestedEmail: {
        in: ["body"],
        optional: true,
        isEmail: true,
        errorMessage: "Please provide a valid email"
      }
    }),
    usersCtrl.delete
  )
  .patch(
    auth,
    checkSchema({
      email: {
        in: ["params"],
        optional: true,
        isEmail: true,
        errorMessage: "Please provide a valid email"
      },
      firstName: {
        in: ["body"],
        optional: true,
        isString: true,
        errorMessage: "Please provide a valid first name"
      },
      lastName: {
        in: ["body"],
        optional: true,
        isString: true,
        errorMessage: "Please provide a valid last name"
      }
    }),
    usersCtrl.save
  )
  .get(
    auth,
    checkSchema({
      email: {
        in: ["query"],
        optional: true,
        isEmail: true,
        errorMessage: "Please provide a valid email"
      },
      requestedEmail: {
        in: ["body"],
        optional: true,
        isEmail: true,
        errorMessage: "Please provide a valid email"
      }
    }),
    usersCtrl.getUser
  );
//router.route("/make-admin").post(usersCtrl.createAdminUser)

module.exports = router;
