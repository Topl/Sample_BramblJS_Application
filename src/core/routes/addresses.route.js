const Router = require("express").Router
const AddressesCtrl = require("../../modules/v1/addresses/addresses.controller")
const KeyFilesCtrl = require("../../modules/v1/keyfiles/keyfiles.controller")
const RequestValidator = require("../../lib/requestValidator")
const auth = require("../../core/auth")
const {checkSchema} = require("express-validator")
const router = new Router()

// associate put, delete, and get(id)
router.route("/").get(AddressesCtrl.apiGetAddresses)
router.route("/search").get(AddressesCtrl.apiSearchAddresses)
router.route("/users/:email/").get(
    auth,
    checkSchema({
        email: { in: ["params"], optional: true, isEmail: true, errorMessage: "Please provide a valid email" },
        page: { in: ["query"], optional: true, isInt: true, errorMessage: "Please provide a valid page" },
        limit: { in: ["query"], optional: true, isInt: true, errorMessage: "Please provide a valid limit" },
    }),
    AddressesCtrl.apiGetAddressesByUser
    )
router.route("/facet-search").get(AddressesCtrl.apiFacetedSearch)
router.route("/id/:id").get(AddressesCtrl.apiGetAddressById)
router.route("/config-options").get(AddressesCtrl.getConfig)

router  
    .route("/keyfile")
    .post(
        auth,
        checkSchema({
            email: { in: ["body"], optional: false, isEmail: true, errorMessage: "Please provide a valid email" }, 
            network: {
                in: ["body"],
                optional: false,
                custom: {
                    options: RequestValidator.validateNetwork,
                },
            },
            address: {
                in: ["body"],
                optional: false,
                custom: {
                    options: RequestValidator.validateAddress,
                },
            },
        }),
        KeyFilesCtrl.apiPostKeyfile)
    .delete(KeyFilesCtrl.apiDeleteKeyfile)

router  
    .route("/address")
    .post(
        auth,
        checkSchema({
            name: {
                in: ["body"],
                optional: false,
                isString: true,
                errorMessage: "Please provide a valid Address name"
            },
            user_id: { in: ["body"], optional: false, isEmail: true, errorMessage: "Please provide a valid email" },
        }),
        AddressesCtrl.create)
    .put(AddressesCtrl.apiUpdateAddress)
    .delete(AddressesCtrl.apiDeleteAddress)

module.exports = router