const BramblHelper = require("../../../lib/bramblHelper");
const AssetTransfer = require("../../../modifier/transaction/assetTransfer");
const TransferTransactionValidator = require("../../../modifier/transaction/transferTransactionValidator");
const stdError = require("../../../core/standardError");
const Constants = require("../../../util/constants");
const { getObjectDiff } = require("../../../util/extensions");
const TransactionsServiceHelper = require("./transactionsServiceHelper");

const serviceName = "AssetTransaction";

class AssetTransactionService {
  static async generateRawAssetTransfer(args, bramblHelper) {
    return AssetTransfer.createRaw(
      args.recipients,
      args.sender,
      args.changeAddress,
      args.consolidationAddress,
      args.fee,
      args.data,
      args.minting,
      args.assetCode,
      bramblHelper
    ).then(function (value) {
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
      .then(function (rpcResponse) {
        return AssetTransactionService.generateRawAssetTransfer(
          args,
          bramblHelper
        ).then(function (jsResponse) {
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
            return TransactionsServiceHelper.signAndSendTransactionWithStateManagement(
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
      const bramblParams =
        await TransactionsServiceHelper.extractParamsAndAddAddressesToDb(
          bramblHelper,
          args
        );
      bramblParams.assetCode = bramblHelper.createAssetValue(args.name);
      return AssetTransactionService.assetTransferHelper(
        bramblHelper,
        bramblParams
      ).then(function (result) {
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
        const bramblParams =
          await TransactionsServiceHelper.extractParamsAndAddAddressesToDb(
            bramblHelper,
            args
          );
        bramblParams.assetCode = args.assetCode;
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
        const bramblParams =
          await TransactionsServiceHelper.extractParamsAndAddAddressesToDb(
            bramblHelper,
            args
          );
        bramblParams.assetCode = args.assetCode;
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
