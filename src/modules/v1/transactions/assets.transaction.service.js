const BramblHelper = require("../../../lib/bramblHelper");
const RequestValidator = require("../../../lib/requestValidator");
const stdError = require("../../../core/standardError");
const Constants = require("../../../util/constants");
const blake = require("blake2");
const Base58 = require("base-58");

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
        return bramblHelper
          .sendRawAssetTransaction(result)
          .then(function(value) {
            if (value.error != null) {
              throw stdError(500, value.error, serviceName, serviceName);
            } else {
              return bramblHelper.signTransaction(value).then(function(value) {
                if (value.error != null) {
                  throw stdError(500, value.error, serviceName, serviceName);
                } else {
                  return bramblHelper
                    .sendSignedTransaction(value)
                    .then(function(value) {
                      if (value.error != null) {
                        throw stdError(
                          500,
                          value.error,
                          serviceName,
                          serviceName
                        );
                      } else {
                        return value;
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
    return await RequestValidator.validateBody(args, "transfer").then(function(
      result
    ) {
      const bramblHelper = new BramblHelper(
        false,
        args.password,
        args.network,
        args.keyFilePath
      );
      if (bramblHelper) {
        if (result.assetCode != null) {
          result.minting = false;
          return bramblHelper
            .sendRawAssetTransaction(result)
            .then(function(value) {
              if (value.error != null) {
                throw stdError(500, value.error, serviceName, serviceName);
              } else {
                return bramblHelper
                  .signTransaction(value)
                  .then(function(value) {
                    if (value.error != null) {
                      throw stdError(
                        500,
                        value.error,
                        serviceName,
                        serviceName
                      );
                    } else {
                      return bramblHelper
                        .sendSignedTransaction(value)
                        .then(function(value) {
                          if (value.error != null) {
                            throw stdError(
                              500,
                              value.error,
                              serviceName,
                              serviceName
                            );
                          } else {
                            return value;
                          }
                        });
                    }
                  });
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
    });
  }

  static async burnAsset(args) {
    return await RequestValidator.validateBody(args).then(function(result) {
      const bramblHelper = new BramblHelper(
        false,
        args.password,
        args.network,
        args.keyFilePath
      );
      if (bramblHelper) {
        if (result.assetCode != null) {
          result.recipients = [[Constants.BURNER_ADDRESS, args.quantity]];
          result.minting = false;
          return bramblHelper
            .sendRawAssetTransaction(result)
            .then(function(value) {
              if (value.error != null) {
                throw stdError(500, value.error, serviceName, serviceName);
              } else {
                return bramblHelper
                  .signTransaction(value)
                  .then(function(value) {
                    if (value.error != null) {
                      throw stdError(
                        500,
                        value.error,
                        serviceName,
                        serviceName
                      );
                    } else {
                      return bramblHelper
                        .sendSignedTransaction(value)
                        .then(function(value) {
                          if (value.error != null) {
                            throw stdError(
                              500,
                              value.error,
                              serviceName,
                              serviceName
                            );
                          } else {
                            return value;
                          }
                        });
                    }
                  });
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
    });
  }
}

module.exports = AssetTransactionService;
