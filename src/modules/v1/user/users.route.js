const Router = require("express").Router;
const usersCtrl = require("./users.controller");
const auth = require("../../../core/auth");
const { checkSchema } = require("express-validator");

const router = new Router();

// associate put, delete, and get(id)
router.route("/register").post(
    checkSchema({
        firstName: {
            in: ["body"],
            optional: false,
            isString: true,
            errorMessage: "Please provide a valid first name",
        },
        lastName: {
            in: ["body"],
            optional: false,
            isString: true,
            errorMessage: "Please provide a valid last name",
        },
        email: {
            in: ["body"],
            optional: false,
            isEmail: true,
            errorMessage: "Please provide a valid email",
        },
    }),
    usersCtrl.register
);
router.route("").delete(
    auth,
    checkSchema({
        user_id: {
            in: ["body"],
            optional: false,
            isEmail: true,
            errorMessage: "Please provide a valid email",
        },
        requestedEmail: {
            in: ["body"],
            optional: true,
            isEmail: true,
            errorMessage: "Please provide a valid email",
        },
    }),
    usersCtrl.delete
);

router.route("").patch(
    auth,
    checkSchema({
        email: {
            in: ["body"],
            optional: true,
            isEmail: true,
            errorMessage: "Please provide a valid email",
        },
        firstName: {
            in: ["body"],
            optional: true,
            isString: true,
            errorMessage: "Please provide a valid first name",
        },
        lastName: {
            in: ["body"],
            optional: true,
            isString: true,
            errorMessage: "Please provide a valid last name",
        },
    }),
    usersCtrl.save
);

router.route("").get(
    auth,
    checkSchema({
        email: {
            in: ["body"],
            optional: true,
            isEmail: true,
            errorMessage: "Please provide a valid email",
        },
        requestedEmail: {
            in: ["body"],
            optional: true,
            isEmail: true,
            errorMessage: "Please provide a valid email",
        },
    }),
    usersCtrl.getUser
);

module.exports = router;
