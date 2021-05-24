const BramblHelper = require("../../../lib/bramblHelper");
const stdError = require("../../../core/standardError");
const Constants = require("../../../util/constants");
const TransactionsServiceHelper = require("./transactionsServiceHelper");

const serviceName = "AssetTransaction";

class AssetTransactionService {
  static async assetTransferHelper(bramblHelper, args) {
    return bramblHelper.sendRawAssetTransaction(args).then(function(value) {
      if (value.error) {
        return value;
      } else {
        return TransactionsServiceHelper.signAndSendTransactionWithStateManagement(
          value,
          bramblHelper,
          args
        );
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
      args.assetCode = bramblHelper.createAssetValue(args.name);
      const bramblParams = await TransactionsServiceHelper.extractParamsAndAddAddressesToDb(
        bramblHelper,
        args
      );
      return AssetTransactionService.assetTransferHelper(
        bramblHelper,
        bramblParams
      );
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
        const bramblParams = await TransactionsServiceHelper.extractParamsAndAddAddressesToDb(
          bramblHelper,
          args
        );
        return AssetTransactionService.assetTransferHelper(
          bramblHelper,
          bramblParams
        );
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
        const bramblParams = await TransactionsServiceHelper.extractParamsAndAddAddressesToDb(
          bramblHelper,
          args
        );
        return AssetTransactionService.assetTransferHelper(
          bramblHelper,
          bramblParams
        );
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
