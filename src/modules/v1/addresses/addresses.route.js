const Router = require("express").Router;
const AddressesCtrl = require("./addresses.controller");
const auth = require("../../../core/auth");
const { checkSchema } = require("express-validator");
const router = new Router();

// associate put, delete, and get(id)
router.route("/").get(
  auth,
  checkSchema({
    page: {
      in: ["query"],
      optional: true,
      isInt: true,
      errorMessage: "Please provide a valid page number"
    },
    limit: {
      in: ["query"],
      optional: true,
      isInt: {
        options: { max: 100 }
      },
      errorMessage: "Please provide a valid limit"
    }
  }),
  AddressesCtrl.apiGetAddresses
);
router.route("/users/").get(
  auth,
  checkSchema({
    user_id: {
      in: ["body"],
      optional: false,
      isEmail: true,
      errorMessage: "Please provide a valid email"
    },
    page: {
      in: ["query"],
      optional: true,
      isInt: true,
      errorMessage: "Please provide a valid page"
    },
    limit: {
      in: ["query"],
      optional: true,
      isInt: true,
      errorMessage: "Please provide a valid limit"
    }
  }),
  AddressesCtrl.apiGetAddressesByUser
);
router.route("/:id").get(
  auth,
  checkSchema({
    id: {
      in: ["params"],
      optional: false,
      isMongoId: true,
      errorMessage: "Please provide a valid Address ID"
    }
  }),
  AddressesCtrl.apiGetAddressById
);

router.route("/address").post(
  auth,
  checkSchema({
    name: {
      in: ["body"],
      optional: false,
      isString: true,
      errorMessage: "Please provide a valid Address name"
    },
    user_id: {
      in: ["body"],
      optional: false,
      isEmail: true,
      errorMessage: "Please provide a valid email"
    }
  }),
  AddressesCtrl.create
);

router.patch(
  `/:_id`,
  auth,
  checkSchema({
    _id: {
      in: ["params"],
      optional: false,
      isMongoId: true,
      errorMessage: "Please provide a valid addressId"
    },
    name: {
      in: ["body"],
      optional: true,
      isString: true,
      errorMessage: "Please provide a valid update body"
    }
  }),
  AddressesCtrl.apiUpdateAddressById
);
router.delete(
  `/:_id`,
  auth,
  checkSchema({
    _id: {
      in: ["params"],
      optional: false,
      isMongoId: true,
      errorMessage: "Please provide a valid Project ID"
    }
  }),
  AddressesCtrl.apiDeleteAddress
);

module.exports = router;
