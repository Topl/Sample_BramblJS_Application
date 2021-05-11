const BramblHelper = require("../../../lib/bramblHelper");
const RequestValidator = require("../../../lib/requestValidator");
const stdError = require("../../../core/standardError");
const { MAX_INTEGER } = require("../../../util/constants");

const serviceName = "polyTransaction";

class PolyTransactionService {
  static async getBalance(args) {
    const bramblHelper = new BramblHelper(true, args.password, args.network);
    let address = "";
    address =
      args.address != null &&
      RequestValidator.validateAddress(args.address, args.network)
        ? args.address
        : false;
    if (address === false) {
      throw stdError(404, "Unable to find address", serviceName, serviceName);
    } else {
      return await bramblHelper.getBalance(address);
    }
  }

  static async getBlockNumber(args) {
    const bramblHelper = new BramblHelper(true, args.password, args.network);
    return await bramblHelper.getBlockNumber();
  }

  static async getBlock(args) {
    const bramblHelper = new BramblHelper(true, args.password, args.network);
    return await bramblHelper.getBlock(args.blockNumber);
  }

  static async getTransactionFromMempool(args) {
    const bramblHelper = new BramblHelper(true, args.password, args.network);
    return await bramblHelper.getTransactionFromMempool(args.transactionId);
  }

  static async getTransactionFromBlock(args) {
    const bramblHelper = new BramblHelper(true, args.password, args.network);
    return await bramblHelper.getTransactionFromBlock(args.transactionId);
  }

  static async rawPolyTransaction(args) {
    const bramblHelper = new BramblHelper(true, args.password, args.network);
    const e = await RequestValidator.validateBody(args).then(obj => {
      return bramblHelper.sendRawPolyTransaction(obj);
    });
    return e;
  }

  static async polyTransaction(args) {
    const bramblHelper = new BramblHelper(
      false,
      args.password,
      args.network,
      args.keyFilePath
    );
    if (bramblHelper) {
      return bramblHelper.sendRawPolyTransaction(args).then(function(value) {
        if (value.error) {
          throw stdError(500, value.error, serviceName, serviceName);
        } else {
          return bramblHelper.signAndSendTransaction(value);
        }
      });
    } else {
      throw stdError(
        404,
        "Missing or Invalid Private Key",
        serviceName,
        serviceName
      );
    }
  }
}

module.exports = PolyTransactionService;
