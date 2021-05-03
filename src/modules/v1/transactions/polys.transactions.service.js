const BN = require("bn.js");
const BramblHelper = require("../../../lib/bramblHelper");
const RequestValidator = require("../../../lib/requestValidator");
const stdError = require("../../../core/standardError");

const serviceName = "polyTransaction";

const MAX_INTEGER = new BN("7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", 16);

class PolyTransactionService {
  static async getBalance(args) {
    const bramblHelper = new BramblHelper(args.password, args.network);
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
    const bramblHelper = new BramblHelper(args.password, args.network);
    return await bramblHelper.getBlockNumber();
  }

  static async getBlock(args) {
    const bramblHelper = new BramblHelper(args.password, args.network);
    return await bramblHelper.getBlock(args.blockNumber);
  }

  static async getTransactionFromMempool(args) {
    const bramblHelper = new BramblHelper(args.password, args.network);
    return await bramblHelper.getTransactionFromMempool(args.transactionId);
  }

  static async getTransactionFromBlock(args) {
    const bramblHelper = new BramblHelper(args.password, args.network);
    return await bramblHelper.getTransactionFromBlock(args.transactionId);
  }

  static async rawPolyTransaction(args) {
    const bramblHelper = new BramblHelper(args.password, args.network);
    const e = await RequestValidator.validateBody(args).then(obj => {
      return bramblHelper.sendRawPolyTransaction(obj);
    });
    return e;
  }

  static async polyTransaction(args) {
    const bramblHelper = new BramblHelper(
      args.password,
      args.network,
      args.keyFilePath
    );
    if (bramblHelper != null) {
      return await RequestValidator.validateBody(args).then(function(result) {
        return bramblHelper.polyTransaction(result);
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

  _validateCannotExceedMaxInteger(values) {
    for (const [key, value] of Object.entries(values)) {
      if (value?.get(MAX_INTEGER)) {
        throw new Error(`${key} cannot exceed MAX_INTEGER given ${value}`);
      }
    }
  }
}

module.exports = PolyTransactionService;
