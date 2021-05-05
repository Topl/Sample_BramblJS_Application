const BramblHelper = require("../../../lib/bramblHelper");
const RequestValidator = require("../../../lib/requestValidator");
const stdError = require("../../../core/standardError");

const serviceName = "AssetTransaction";

class AssetTransactionService {
  static async createAsset(args) {
    return await RequestValidator.validateBody(args).then(function(result) {
      const bramblHelper = new BramblHelper(
        false,
        args.password,
        args.network,
        args.keyFilePath
      );
      if (bramblHelper) {
        var assetCode = bramblHelper.createAssetValue(args.name);
        result.assetCode = assetCode;
        result.name = args.name;
        result.minting = args.minting;
        bramblHelper.sendRawAssetTransaction(result).then(value => {
          if (value.error != null) {
            throw stdError(500, value.error, serviceName, serviceName);
          } else {
            bramblHelper.signTransaction(value).then(value => {
              if (value.error != null) {
                throw stdError(500, value.error, serviceName, serviceName);
              } else {
                bramblHelper.sendSignedTransaction(value).then(function(value) {
                  if (value.error != null) {
                    throw stdError(500, value.error, serviceName, serviceName);
                  } else {
                    value;
                  }
                });
              }
            });
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
    });
  }

  static async updateAsset(args) {
    const bramblHelper = new BramblHelper(
      false,
      args.password,
      args.network,
      args.keyFilePath
    );
    if (bramblHelper) {
      return await RequestValidator.validateBody(args).then(function(result) {
        if (result.assetCode != null) {
          result.minting = false;
          return bramblHelper.assetTransaction(result);
        } else {
          throw stdError(
            404,
            "Missing or Invalid Asset Code",
            serviceName,
            serviceName
          );
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

module.exports = AssetTransactionService;
