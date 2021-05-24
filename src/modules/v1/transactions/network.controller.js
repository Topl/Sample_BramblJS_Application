const PolyTransactionService = require("./polys.transactions.service");
const AssetTransactionService = require("./assets.transaction.service");
const ReadTransactionService = require("./read.transactions.service");
const stdRoute = require(`../../../core/standardRoute`);

class NetworkController {
  static getTest(req, res) {
    res.send("Topl API");
  }

  static async getBalance(req, res, next) {
    const handler = ReadTransactionService.getBalance;
    const network = req.body.network;
    const password = req.body.password;
    const address = req.params.address;
    const args = {
      network: network,
      password: password,
      address: address,
      name: req.body.name,
      userEmail: req.body.userEmail
    };
    const responseMsg = {
      success: "Retrieved balance for address"
    };
    stdRoute(req, res, next, handler, args, responseMsg);
  }

  static async getBlockNumber(req, res, next) {
    const handler = ReadTransactionService.getBlockNumber;
    const args = {
      network: req.body.network,
      password: req.body.password
    };
    const responseMsg = {
      success: "Retrieved block number at head of chain"
    };
    stdRoute(req, res, next, handler, args, responseMsg);
  }

  static async getBlock(req, res, next) {
    const handler = ReadTransactionService.getBlock;
    const args = {
      password: req.body.password,
      network: req.body.network,
      blockNumber: req.params.blockNumber
    };

    const responseMsg = {
      success: "Retrieved block by height"
    };
    stdRoute(req, res, next, handler, args, responseMsg);
  }

  static async getTransactionFromMempool(req, res, next) {
    const handler = ReadTransactionService.getTransactionFromMempool;
    const args = {
      password: req.body.password,
      network: req.body.network,
      transactionId: req.params.transactionId
    };
    const responseMsg = {
      success: "Retrieved Transaction from Mempool"
    };
    stdRoute(req, res, next, handler, args, responseMsg);
  }

  static async getTransactionFromBlock(req, res, next) {
    const handler = ReadTransactionService.getTransactionFromBlock;
    const args = {
      password: req.body.password,
      network: req.body.network,
      transactionId: req.params.transactionId
    };
    const responseMsg = {
      success: "Retrieved Transaction from Block"
    };
    stdRoute(req, res, next, handler, args, responseMsg);
  }

  static async sendRawPolyTransaction(req, res, next) {
    const handler = PolyTransactionService.rawPolyTransaction;
    const args = req.body;
    const responseMsg = {
      success: "Sent raw poly transaction"
    };
    stdRoute(req, res, next, handler, args, responseMsg);
  }

  static async sendPolyTransaction(req, res, next) {
    const handler = PolyTransactionService.polyTransaction;
    const args = req.body;
    const responseMsg = {
      success: "Sent poly transaction"
    };
    stdRoute(req, res, next, handler, args, responseMsg);
  }

  static async sendAssetTransaction(req, res, next) {
    const handler = AssetTransactionService.createAsset;
    const args = req.body;
    const responseMsg = {
      success: "Sent asset transaction"
    };
    stdRoute(req, res, next, handler, args, responseMsg);
  }

  static async updateAsset(req, res, next) {
    const handler = AssetTransactionService.updateAsset;
    const args = req.body;
    const responseMsg = {
      success: "Updated asset"
    };
    stdRoute(req, res, next, handler, args, responseMsg);
  }

  static async burnAsset(req, res, next) {
    const handler = AssetTransactionService.burnAsset;
    const args = req.body;
    const responseMsg = {
      success: "Burnt asset"
    };
    stdRoute(req, res, next, handler, args, responseMsg);
  }
}

module.exports = NetworkController;
