const Router = require("express").Router
const AddressesCtrl = require("../../modules/v1/addresses/addresses.controller")
const KeyFilesCtrl = require("../../modules/v1/keyfiles//keyfiles.controller")

const router = new Router()

// associate put, delete, and get(id)
router.route("/").get(AddressesCtrl.apiGetAddresses)
router.route("/search").get(AddressesCtrl.apiSearchAddresses)
router.route("/users").get(AddressesCtrl.apiGetAddressesByUser)
router.route("/facet-search").get(AddressesCtrl.apiFacetedSearch)
router.route("/id/:id").get(AddressesCtrl.apiGetAddressById)
router.route("/config-options").get(AddressesCtrl.getConfig)

router  
    .route("/keyfile")
    .post(KeyFilesCtrl.apiPostKeyfile)
    .put(KeyFilesCtrl.apiUpdateKeyfile)
    .delete(KeyFilesCtrl.apiDeleteKeyfile)

router  
    .route("/address")
    .post(AddressesCtrl.apiPostAddress)
    .put(AddressesCtrl.apiUpdateAddress)
    .delete(AddressesCtrl.apiDeleteAddress)

module.exports = router