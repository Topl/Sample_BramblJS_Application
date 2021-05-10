const BramblHelper = require("../../../lib/bramblHelper");
const stdError = require("../../../core/standardError");
const Constants = require("../../../util/constants");
const Base58 = require("base-58");

const serviceName = "AssetTransaction";

class AssetTransactionService {
  static async createAsset(args) {
    const bramblHelper = new BramblHelper(
      false,
      args.password,
      args.network,
      args.keyFilePath
    );
    if (bramblHelper) {
      var assetCode = bramblHelper.createAssetValue(args.name);
      args.assetCode = assetCode;
      return bramblHelper.sendRawAssetTransaction(args).then(function(value) {
        if (value.error) {
          throw stdError(500, value.error, serviceName, serviceName);
        } else {
          return bramblHelper.signAndSendTransaction(value);
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
        return bramblHelper.sendRawAssetTransaction(args).then(function(value) {
          if (value.error) {
            throw stdError(500, value.error, serviceName, serviceName);
          } else {
            return bramblHelper.signAndSendTransaction(value);
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
        return bramblHelper.sendRawAssetTransaction(args).then(function(value) {
          if (value.error) {
            throw stdError(500, value.error, serviceName, serviceName);
          } else {
            return bramblHelper.signAndSendTransaction(value);
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

module.exports = AssetTransactionService;
