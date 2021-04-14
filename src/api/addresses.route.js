import { Router } from "express"
import AddressesCtrl from "./addresses.controller"
import KeyFilesCtrl from "./keyfiles.controller"

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

export default router