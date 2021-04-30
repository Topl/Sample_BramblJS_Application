const BramblHelper = require("../../../lib/bramblHelper");
const RequestValidator = require("../../../lib/requestValidator");
const stdError = require("../../../core/standardError");

const serviceName = "AssetTransaction";

class AssetTransactionService {
  static async createAsset(args) {
    const bramblHelper = new BramblHelper(
      args.password,
      args.network,
      args.keyFilePath
    );
    if (bramblHelper) {
      return await RequestValidator.validateBody(args).then(function(result) {
        result.name = args.name;
        result.minting = args.minting;
        return bramblHelper.assetTransaction(result);
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

  // static async updateAsset(args) {
  //   const bramblHelper = new BramblHelper(
  //     args.password,
  //     args.network,
  //     args.keyFilePath
  //   );
  // }
}

module.exports = AssetTransactionService;
