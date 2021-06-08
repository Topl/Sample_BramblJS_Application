const Router = require("express").Router;
const NetworkCtrl = require("./transactions/network.controller");
const { checkSchema } = require("express-validator");
const router = new Router();

router.route("/").get(NetworkCtrl.getTest);

router.route("/balance/:address").get(
  checkSchema({
    address: {
      in: ["params"],
      optional: false,
      errorMessage: "Please provide a valid address",
    },
  }),
  NetworkCtrl.getBalance
);

router.route("/block").get(NetworkCtrl.getBlockNumber);
router.route("/block/:blockNumber").get(NetworkCtrl.getBlock);
router.route("/tx/:transactionId").get(NetworkCtrl.getTransactionFromMempool);
router
  .route("/tx-from-block/:transactionId")
  .get(NetworkCtrl.getTransactionFromBlock);

// Endpoints to perform a poly transaction
router.route("/send-raw-poly-tx").post(NetworkCtrl.sendRawPolyTransaction);
router.route("/send-poly-tx").post(NetworkCtrl.sendPolyTransaction);
router.route("/send-asset-tx").post(NetworkCtrl.sendAssetTransaction);
router.route("/send-asset-tx").patch(NetworkCtrl.updateAsset);
router.route("/send-asset-tx").delete(NetworkCtrl.burnAsset);

module.exports = router;
