const BramblHelper = require("../../../lib/bramblHelper");
const AssetTransfer = require("../../../modifier/transaction/assetTransfer");
const TransferTransactionValidator = require("../../../modifier/transaction/transferTransactionValidator");
const stdError = require("../../../core/standardError");
const Constants = require("../../../util/constants");
const transactionsServiceHelper = require("./transactionsServiceHelper");
const _ = require("lodash");

const serviceName = "AssetTransaction";

class AssetTransactionService {
  static async generateRawAssetTransfer(bramblHelper, args) {
    return AssetTransfer.createRaw(
      Object.entries(args.recipients),
      args.senders,
      args.changeAddress,
      args.consolidationAddress,
      args.fee,
      args.data,
      args.minting
    ).then(function(value) {
      if (value.error) {
        return value;
      } else {
        // validate tx
        const txValidator = new TransferTransactionValidator(value);
        const txValid = txValidator.rawSyntacticValidation();
        if (txValid.error) {
          return txValid;
        } else {
          return value;
        }
      }
    });
  }

  static async assetTransferHelper(bramblHelper, args) {
    return bramblHelper
      .sendRawAssetTransaction(args)
      .then(function(rpcResponse) {
        return AssetTransactionService.generateRawAssetTransfer(
          bramblHelper,
          args
        ).then(function(jsResponse) {
          if (jsResponse.error) {
            return jsResponse;
          }
          const rawTransferTransaction = new AssetTransfer(
            rpcResponse.messageToSign.result.rawTx.from,
            rpcResponse.messageToSign.result.rawTx.to,
            new Map(),
            rpcResponse.messageToSign.result.rawTx.fee,
            jsResponse.timestamp,
            rpcResponse.messageToSign.result.rawTx.data,
            rpcResponse.messageToSign.result.rawTx.minting
          );
          if (getObjectDiff(jsResponse, rawTransferTransaction)) {
            return transactionsServiceHelper.signAndSendTransactionWithStateManagement(
              rpcResponse,
              bramblHelper,
              args
            );
          } else {
            throw stdError(
              500,
              "Invalid RPC Response",
              serviceName,
              serviceName
            );
          }
        });
      });
  }

  static async createAsset(args) {
    const bramblHelper = new BramblHelper(
      false,
      args.password,
      args.network,
      args.keyFilePath
    );
    args.address = bramblHelper.brambljs.keyManager.address;
    if (bramblHelper) {
      // iterate through all sender, recipient, and change addresses checking whether or not they are in the DB
      args.addresses = await transactionsServiceHelper.addAddressesToDBFromTransaction(
        bramblHelper,
        args
      );
      var assetCode = bramblHelper.createAssetValue(args.name);
      args.assetCode = assetCode;
      args.address = bramblHelper.brambljs.keyManager.address;
      for (var key in args.recipients) {
        args.recipients[key].assetCode = assetCode;
      }
      return AssetTransactionService.assetTransferHelper(
        bramblHelper,
        args
      ).then(function(result) {
        if (result.error) {
          throw stdError(500, result.error, serviceName, serviceName);
        } else {
          return result;
        }
      });
    } else {
      throw stdError(
        404,
        "Missing or Invalid KeyfilePath",
        serviceName,
        serviceName
      );
    }
  }

  static async updateAsset(args) {
    const bramblHelper = new BramblHelper(
      false,
      args.password,
      args.network,
      args.keyFilePath
    );
    if (bramblHelper) {
      if (args.assetCode) {
        args.minting = false;
        args.address = bramblHelper.brambljs.keyManager.address;
        // iterate through all sender, recipient, and change addresses checking whether or not they are in the db
        args.addresses = await transactionsServiceHelper.addAddressesToDBFromTransaction(
          bramblHelper,
          args
        );
        for (var key in args.recipients) {
          args.recipients[key].assetCode = args.assetCode;
        }
        return AssetTransactionService.assetTransferHelper(
          bramblHelper,
          args
        ).then(function(result) {
          if (result.error) {
            throw stdError(500, result.error, serviceName, serviceName);
          } else {
            return result;
          }
        });
      } else {
        throw stdError(
          404,
          "Missing or Invalid Asset Code",
          serviceName,
          serviceName
        );
      }
    }
  }

  static async burnAsset(args) {
    const bramblHelper = new BramblHelper(
      false,
      args.password,
      args.network,
      args.keyFilePath
    );
    if (bramblHelper) {
      if (args.assetCode) {
        args.recipients = [[Constants.BURNER_ADDRESS, args.quantity]];
        args.minting = false;
        args.address = bramblHelper.brambljs.keyManager.address;
        args.addresses = await transactionsServiceHelper.addAddressesToDBFromTransaction(
          bramblHelper,
          args
        );
        for (var key in args.recipients) {
          args.recipients[key].assetCode = args.assetCode;
        }
        return AssetTransactionService.assetTransferHelper(
          bramblHelper,
          args
        ).then(function(result) {
          if (result.error) {
            throw stdError(500, result.error, serviceName, serviceName);
          } else {
            return result;
          }
        });
      } else {
        throw stdError(
          400,
          "Unable to create transaction, please double check your request.",
          serviceName,
          serviceName
        );
      }
    }
  }
}

/*
 * Compare two objects by reducing an array of keys in obj1, having the
 * keys in obj2 as the intial value of the result. Key points:
 *
 * - All keys of obj2 are initially in the result.
 *
 * - If the loop finds a key (from obj1, remember) not in obj2, it adds
 *   it to the result.
 *
 * - If the loop finds a key that are both in obj1 and obj2, it compares
 *   the value. If it's the same value, the key is removed from the result.
 */
function getObjectDiff(obj1, obj2) {
  const diff = Object.keys(obj1).reduce((result, key) => {
    if (!obj2.hasOwnProperty(key)) {
      result.push(key);
    } else if (_.isEqual(obj1[key], obj2[key])) {
      const resultKeyIndex = result.indexOf(key);
      result.splice(resultKeyIndex, 1);
    }
    return result;
  }, Object.keys(obj2));

  return diff;
}

module.exports = AssetTransactionService;
