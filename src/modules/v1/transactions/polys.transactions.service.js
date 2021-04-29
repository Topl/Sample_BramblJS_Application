const BN = require("bn.js");
const BramblHelper = require("../../../lib/bramblHelper");
const AddressValidator = require("../../../lib/addressValidator");
const stdError = require("../../../core/standardError");

const serviceName = "polyTransaction";

const MAX_INTEGER = new BN("7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", 16);

/**
 * This constructor takes the values, validates them if necessary and assigns them and freezes the object.
 */
class PolyTransactionService {
  static getBalance(args) {
    const bramblHelper = new BramblHelper(args.password, args.network);
    let address = "";
    address =
      args.address != null &&
      AddressValidator.isAddress(args.address, args.network)
        ? args.address
        : false;
    if (address === false) {
      throw stdError(404, "Unable to find address", serviceName, serviceName);
    } else {
      bramblHelper.getBalance(address).then(value => {
        return value;
      });
    }
  }

  static getBlockNumber(args) {
    const bramblHelper = new BramblHelper(args.password, args.network);
    bramblHelper.getBlockNumber().then(value => {
      return value;
    });
  }

  static getBlock(args) {
    const bramblHelper = new BramblHelper(args.password, args.network);
    bramblHelper.getBlock(args.blockNumber).then(value => {
      return value;
    });
  }

  static getTransactionFromMempool(args) {
    const bramblHelper = new BramblHelper(args.password, args.network);
    bramblHelper.getTransactionFromMempool(args.transactionId).then(value => {
      return value;
    });
  }

  static getTransactionFromBlock(args) {
    const bramblHelper = new BramblHelper(args.password, args.network);
    bramblHelper.getTransactionFromBlock(args.transactionId).then(value => {
      return value;
    });
  }

  static async rawPolyTransaction(args) {
    const bramblHelper = new BramblHelper(args.password, args.network);
    await this.validateBody(args).then(obj => {
      bramblHelper.sendRawPolyTransaction(obj).then(value => {
        return value;
      });
    });
  }

  static async polyTransaction(args) {
    const bramblHelper = new BramblHelper(args.password, args.network);
    await this.validateBody(args).then(obj => {
      bramblHelper.polyTransaction(args).then(value => {
        return value;
      });
    });
  }

  _validateCannotExceedMaxInteger(values) {
    for (const [key, value] of Object.entries(values)) {
      if (value?.get(MAX_INTEGER)) {
        throw new Error(`${key} cannot exceed MAX_INTEGER given ${value}`);
      }
    }
  }

  async validateBody(body) {
    return new Promise((resolve, reject) => {
      if (typeof body === "object" && Object.keys(body).length != 0) {
        let obj = {};
        obj.sender = body.sender != null ? body.sender : null;
        obj.sender =
          body.sender != null && AddressValidator.isAddress(body.sender)
            ? body.sender
            : (obj.error = "invalid address");
        if (Array.isArray(body.recipients)) {
          for (i = 0; i < body.recipients.length; i++) {
            if (body.recipients[i][0] == null) {
              obj.error = "recipient address missing";
            } else if (!AddressValidator.isAddress(body.recipients[i][0])) {
              obj.error = "invalid address";
            }
          }
        } else {
          obj.error = "recipients is not an array of [String, String]";
        }
        obj.changeAddress =
          body.changeAddress != null ? body.changeAddress : null;
        obj.changeAddress =
          body.changeAddress != null &&
          AddressValidator.isAddress(body.changeAddress)
            ? body.changeAddress
            : (obj.error = "invalid address");
        if (obj.error) {
          reject(new Error(obj.error));
        } else {
          resolve(obj);
        }
      } else {
        reject(new Error("Missing or invalid request json object"));
      }
    });
  }
}

module.exports = PolyTransactionService;
