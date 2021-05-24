const BramblHelper = require("../../../lib/bramblHelper");
const AssetTransfer = require("../../../modifier/transaction/assetTransfer");
const TransferTransactionValidator = require("../../../modifier/transaction/transferTransactionValidator");
const stdError = require("../../../core/standardError");
const Constants = require("../../../util/constants");
const transactionsServiceHelper = require("./transactionsServiceHelper");

const { getObjectDiff } = require("../../../util/extensions");

const serviceName = "AssetTransaction";

class AssetTransactionService {
  static async generateRawAssetTransfer(args) {
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
        return AssetTransactionService.generateRawAssetTransfer(args).then(
          function(jsResponse) {
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
          }
        );
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

module.exports = AssetTransactionService;
