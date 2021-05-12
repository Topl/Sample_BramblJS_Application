const BramblHelper = require("../../../lib/bramblHelper");
const AddressesService = require("../addresses/addresses.service");
const Address = require("../addresses/addresses.model");
const RequestValidator = require("../../../lib/requestValidator");
const { checkExistsByAddress } = require("../../../lib/validation");
const stdError = require("../../../core/standardError");

const serviceName = "polyTransaction";

class PolyTransactionService {
  static async getBalanceHelper(bramblHelper, args) {
    return bramblHelper
      .getBalance(args.address)
      .then(function(polyBalanceResult) {
        return AddressesService.updateAddressByAddress({
          name: args.name,
          addressId: args.address,
          polyBalance: polyBalanceResult.polyBalance
        }).then(function(result) {
          if (result.error) {
            throw stdError(500, result.error, serviceName, serviceName);
          } else {
            return polyBalanceResult;
          }
        });
      });
  }

  static async getBalance(args) {
    const bramblHelper = new BramblHelper(true, args.network);
    let address = "";
    address =
      args.address != null &&
      RequestValidator.validateAddresses([args.address], args.network)
        ? args.address
        : false;
    if (address === false) {
      throw stdError(404, "Unable to find address", serviceName, serviceName);
    } else {
      // check if address exists in the db
      return await checkExistsByAddress(Address, address) // eslint-disable-next-line no-unused-vars
        .then(function(result) {
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
              return PolyTransactionService.getBalanceHelper(
                bramblHelper,
                args
              );
            });
          } else {
            return PolyTransactionService.getBalanceHelper(bramblHelper, args);
          }
        });
    }
  }

  static async getBlockNumber(args) {
    const bramblHelper = new BramblHelper(true, args.password, args.network);
    return await bramblHelper.getBlockNumber();
  }

  static async getBlock(args) {
    const bramblHelper = new BramblHelper(true, args.password, args.network);
    return await bramblHelper.getBlock(args.blockNumber);
  }

  static async getTransactionFromMempool(args) {
    const bramblHelper = new BramblHelper(true, args.password, args.network);
    return await bramblHelper.getTransactionFromMempool(args.transactionId);
  }

  static async getTransactionFromBlock(args) {
    const bramblHelper = new BramblHelper(true, args.password, args.network);
    return await bramblHelper.getTransactionFromBlock(args.transactionId);
  }

  static async rawPolyTransaction(args) {
    const bramblHelper = new BramblHelper(true, args.password, args.network);
    const e = await RequestValidator.validateBody(args).then(obj => {
      return bramblHelper.sendRawPolyTransaction(obj);
    });
    return e;
  }

  static async polyTransactionHelper(bramblHelper, args) {
    return bramblHelper.sendRawPolyTransaction(args).then(function(value) {
      if (value.error) {
        throw stdError(500, value.error, serviceName, serviceName);
      } else {
        return bramblHelper
          .signAndSendTransaction(value)
          .then(function(polyTransactionResult) {
            PolyTransactionService.getBalance(args);
            return polyTransactionResult;
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

  static async polyTransaction(args) {
    const bramblHelper = new BramblHelper(
      false,
      args.password,
      args.network,
      args.keyFilePath
    );
    args.address = bramblHelper.brambljs.keyManager.address;
    if (bramblHelper) {
      return checkExistsByAddress(Address, args.address).then(function(result) {
        if (result.error) {
          return AddressesService.create({
            network: args.network,
            password: args.password,
            name: args.name,
            userEmail: args.userEmail,
            address: args.address
            // eslint-disable-next-line no-unused-vars
          }).then(function(result) {
            return PolyTransactionService.polyTransactionHelper(
              bramblHelper,
              args
            );
          });
        } else {
          return PolyTransactionService.polyTransactionHelper(
            bramblHelper,
            args
          );
        }
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
}

module.exports = PolyTransactionService;
