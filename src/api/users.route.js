import { Router } from "express"
import usersCtrl from "./users.controller"
import keyfileCtrl from "./keyfiles.controller"

const router = new Router()

// associate put, delete, and get(id)
router.route("/register").post(usersCtrl.register)
router.route("/login").post(usersCtrl.login)
router.route("/logout").opst(usersCtrl.logout)
router.route("/delete").delete(usersCtrl.delete)
router.route("/update-keyfile").put(usersCtrl.save)
router.route("/make-admin").post(usersCtrl.createAdminUser)

export default router