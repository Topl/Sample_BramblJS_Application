const BramblHelper = require("../../../lib/bramblHelper");
const RawTransactionHelper = require("../../../modifier/transaction/rawTransactionHelper");
const TransferTransactionValidator = require("../../../modifier/transaction/transferTransactionValidator");
const stdError = require("../../../core/standardError");
const Constants = require("../../../util/constants");
const transactionsServiceHelper = require("./transactionsServiceHelper");
const TransferTransaction = require("../../../modifier/transaction/transferTransaction");

const serviceName = "AssetTransaction";

class AssetTransactionService {

  static async generateRawAssetTransfer(bramblHelper, args) {
    return RawTransactionHelper.createRaw(
      args.recipients,
      args.senders,
      args.changeAddress,
      args.consolidationAddress,
      args.fee,
      args.data,
      args.minting.args.networkPrefix
    ).then(function(value) {
      if (value.error) {
        return value;
      } else {
        // validate tx
        const txValidator = new TransferTransactionValidator(value);
        const txValid = txValidator.rawSyntacticValidation();
        if (txValid.error){
          return txValid;
        } else {
        }
          return value;
        }
      }
    );
  }


  static async assetTransferHelper(bramblHelper, args) {
    return bramblHelper.sendRawPolyTransaction(args).then(function(rpcResponse) {
      return AssetTransactionService.generateRawAssetTransfer(bramblHelper, args).then(function(jsResponse) {
        const rawTransferTransaction = new TransferTransaction()
      });
    })
          return transactionsServiceHelper.signAndSendTransactionWithStateManagement(
            value,
            bramblHelper,
            args
          );
        }
      }
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
      return AssetTransactionService.assetTransferHelper(bramblHelper, args);
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
        return AssetTransactionService.assetTransferHelper(bramblHelper, args);
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
        return AssetTransactionService.assetTransferHelper(bramblHelper, args);
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
