const PolyTransactionService = require("./polys.transactions.service");
const stdRoute = require(`../../../core/standardRoute`);

class NetworkController {
  static getTest(req, res) {
    res.send("Topl API");
  }

  static async getBalance(req, res) {
    const handler = PolyTransactionService.getBalance;
    const network = req.body.network;
    const password = req.body.password;
    const address = req.params.address;
    const args = {
      network: network,
      password: password,
      address: address
    };
    const responseMsg = {
      success: "Retrieved balance for address"
    };
    stdRoute(req, res, handler, args, responseMsg);
  }

  static async getBlockNumber(req, res) {
    const handler = PolyTransactionService.getBlockNumber;
    const args = {
      network: req.body.network,
      password: req.body.password
    };
    const responseMsg = {
      success: "Retrieved block number at head of chain"
    };
    stdRoute(req, res, handler, args, responseMsg);
  }

  static async getBlock(req, res) {
    const handler = PolyTransactionService.getBlock;
    const args = {
      password: req.body.password,
      network: req.body.network,
      blockNumber: req.body.blockNumber
    };

    const responseMsg = {
      success: "Retrieved block by height"
    };
    stdRoute(req, res, handler, args, responseMsg);
  }

  static async getTransactionFromMempool(req, res) {
    const handler = PolyTransactionService.getTransactionFromMempool;
    const args = {
      password: req.body.password,
      network: req.body.network,
      transactionId: req.body.transactionId
    };
    const responseMsg = {
      success: "Retrieved Transaction from Mempool"
    };
    stdRoute(req, res, handler, args, responseMsg);
  }

  static async getTransactionFromBlock(req, res) {
    const handler = PolyTransactionService.getTransactionFromBlock;
    const args = {
      password: req.body.password,
      network: req.body.network,
      transactionId: req.body.transactionId
    };
    const responseMsg = {
      success: "Retrieved Transaction from Block"
    };
    stdRoute(req, res, handler, args, responseMsg);
  }

  static async sendRawPolyTransaction(req, res) {
    const handler = PolyTransactionService.rawPolyTransaction;
    const args = req.body;
    const responseMsg = {
      success: "Sent raw poly transaction"
    };
    stdRoute(req, res, handler, args, responseMsg);
  }

  static async sendPolyTransaction(req, res) {
    const handler = PolyTransactionService.polyTransaction;
    const args = req.body;
    const responseMsg = {
      success: "Sent poly transaction"
    };
    stdRoute(req, res, handler, args, responseMsg);
  }
}

module.exports = NetworkController;
