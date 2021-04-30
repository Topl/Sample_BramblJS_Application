const BN = require("bn.js");
const BramblHelper = require("../../../lib/bramblHelper");
const AddressValidator = require("../../../lib/addressValidator");
const stdError = require("../../../core/standardError");

const serviceName = "polyTransaction";

const PROPOSITION_TYPES = ["PublicKeyCurve25519", "ThresholdCurve25519"];

const MAX_INTEGER = new BN("7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", 16);

/**
 * This constructor takes the values, validates them if necessary and assigns them and freezes the object.
 */
class PolyTransactionService {
  static async getBalance(args) {
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
    const e = await PolyTransactionService.validateBody(args).then(obj => {
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
      return await PolyTransactionService.validateBody(args).then(function(
        result
      ) {
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

  static async validateBody(body) {
    return new Promise((resolve, reject) => {
      if (typeof body === "object" && Object.keys(body).length != 0) {
        let obj = {};
        obj.propositionType = PROPOSITION_TYPES.find(proposition => {
          return proposition === body.propositionType;
        })
          ? body.propositionType
          : null;
        obj.sender = body.sender != null ? body.sender : null;
        obj.sender =
          body.sender != null && AddressValidator.isAddress(body.sender)
            ? body.sender
            : (obj.error = "invalid address");
        if (Array.isArray(body.recipients)) {
          for (var i = 0; i < body.recipients.length; i++) {
            if (body.recipients[i][0] == null) {
              obj.error = "recipient address missing";
            } else if (!AddressValidator.isAddress(body.recipients[i][0])) {
              obj.error = "invalid address";
            } else {
              obj.recipients = body.recipients;
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
