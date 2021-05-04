const BramblHelper = require("../../../lib/bramblHelper");
const RequestValidator = require("../../../lib/requestValidator");
const stdError = require("../../../core/standardError");
const Constants = require("../../../util/constants");
const blake = require("blake2");
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
      return await RequestValidator.validateBody(args, "create").then(function(
        result
      ) {
        var assetCode = bramblHelper.createAssetValue(args.name);
        result.assetCode = assetCode;
        result.name = args.name;
        result.minting = args.minting;
        return bramblHelper.assetTransaction(result);
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
      return await RequestValidator.validateBody(args, "transfer").then(
        function(result) {
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
        }
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

  static async burnAsset(args) {
    const bramblHelper = new BramblHelper(
      false,
      args.password,
      args.network,
      args.keyFilePath
    );
    if (bramblHelper) {
      return await RequestValidator.validateBody(args, "burn").then(function(
        result
      ) {
        if (result.assetCode != null) {
          const concatEvidence = Buffer.from(Constants.CONCAT_EVIDENCE);
          const hashChecksumBuffer = blake
            .createHash("blake2b", { digestLength: 32 })
            .update(concatEvidence)
            .end()
            .read()
            .slice(0, 4);
          const address = Buffer.concat(
            [concatEvidence, hashChecksumBuffer],
            38
          );
          result.recipients = [[Base58.encode(address), args.quantity]];
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
