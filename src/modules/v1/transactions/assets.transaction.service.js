const BramblHelper = require("../../../lib/bramblHelper");
const stdError = require("../../../core/standardError");
const Constants = require("../../../util/constants");
const AddressesService = require("../addresses/addresses.service");
const PolyTransactionService = require("./polys.transactions.service");
const Address = require("../addresses/addresses.model");
const { checkExistsByAddress } = require("../../../lib/validation");

const serviceName = "AssetTransaction";

class AssetTransactionService {
  static async assetTransfer(bramblHelper, args) {
    return checkExistsByAddress(Address, args.address).then(function(result) {
      // if the address is not in the db, add to the db
      if (result.error) {
        return AddressesService.create({
          network: args.network,
          password: args.password,
          name: args.name,
          userEmail: args.userEmail,
          address: args.address
          // eslint-disable-next-line no-unused-vars
        }).then(function(result) {
          return AssetTransactionService.assetTransferHelper(
            bramblHelper,
            args
          );
        });
      } else {
        return AssetTransactionService.assetTransferHelper(bramblHelper, args);
      }
    });
  }

  static async assetTransferHelper(bramblHelper, args) {
    return bramblHelper.sendRawAssetTransaction(args).then(function(value) {
      if (value.error) {
        throw stdError(500, value.error, serviceName, serviceName);
      } else {
        return bramblHelper
          .signAndSendTransaction(value)
          .then(function(assetTransactionResult) {
            PolyTransactionService.getBalance(args);
            return assetTransactionResult;
          })
          .then(function(result) {
            if (result.error) {
              throw stdError(500, result.error, serviceName, serviceName);
            } else {
              return result;
            }
          });
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
    if (bramblHelper) {
      var assetCode = bramblHelper.createAssetValue(args.name);
      args.assetCode = assetCode;
      args.address = bramblHelper.brambljs.keyManager.address;
      return AssetTransactionService.assetTransfer(bramblHelper, args);
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
        // check if address exists in the db
        return AssetTransactionService.assetTransfer(bramblHelper, args);
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
        return AssetTransactionService.assetTransfer(bramblHelper, args);
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
