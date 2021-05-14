const BramblHelper = require("../../../lib/bramblHelper");
const AddressesService = require("../addresses/addresses.service");
const Address = require("../addresses/addresses.model");
const RequestValidator = require("../../../lib/requestValidator");
const { checkExistsByAddress } = require("../../../lib/validation");
const BramblJS = require("brambljs");
const stdError = require("../../../core/standardError");

const serviceName = "polyTransaction";

class PolyTransactionService {
  static async getBalanceHelper(bramblHelper, args) {
    return bramblHelper
      .getBalanceWithRequests(args.address)
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
      return checkExistsByAddress(Address, address) // eslint-disable-next-line no-unused-vars
        .then(function(result) {
          // if the address is not in the db, add to the db
          if (result.error) {
            return (
              AddressesService.create({
                network: args.network,
                password: args.password,
                name: args.name,
                userEmail: args.userEmail,
                address: args.address
                // eslint-disable-next-line no-unused-vars
              })
                // eslint-disable-next-line no-unused-vars
                .then(function(result) {
                  return PolyTransactionService.getBalanceHelper(
                    bramblHelper,
                    args
                  );
                })
                .catch(function(err) {
                  console.error(err);
                  throw stdError(
                    400,
                    "Invalid payload, unable to retrieve balance from address",
                    serviceName,
                    serviceName
                  );
                })
            );
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
    const obj = {};
    return bramblHelper.sendRawPolyTransaction(args).then(function(value) {
      if (value.error) {
        return value;
      } else {
        return (
          bramblHelper
            .signAndSendTransaction(value)
            // eslint-disable-next-line no-unused-vars
            .then(function(polyTransactionResult) {
              return Promise.all(
                args.addresses.map(address => {
                  const internalObj = {};
                  const internalArgs = {
                    address: address,
                    network: args.network
                  };
                  obj.address = address;
                  return PolyTransactionService.getBalance(internalArgs)
                    .then(function(result) {
                      internalObj.balance = result;
                      return internalObj;
                    })
                    .catch(function(err) {
                      console.error(err);
                      internalObj.err = err.message;
                      return internalObj;
                    });
                })
              ).catch(function(err) {
                console.error(err);
                obj.err = err.message;
                return obj;
              });
            })
        );
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
      // iterate through all sender, recipient, and change addresses, checking whether or not they are in the DB
      let addresses;
      try {
        addresses = BramblJS.utils.extractAddressesFromObj(args);
        args.addresses = addresses;
      } catch (err) {
        console.error(err);
        throw stdError(
          400,
          "Invalid payload: Addresses are unable to be parsed. Please double check your request.",
          serviceName,
          serviceName
        );
      }
      await addresses.forEach(address => {
        checkExistsByAddress(Address, address).then(function(result) {
          if (result.error) {
            return AddressesService.create({
              network: args.network,
              password: args.password,
              name: args.name,
              userEmail: args.userEmail,
              address: address
              // eslint-disable-next-line no-unused-vars
            });
          }
        });
      });
      return PolyTransactionService.polyTransactionHelper(
        bramblHelper,
        args
      ).then(function(result) {
        if (result.error) {
          throw stdError(500, result.error, serviceName, serviceName);
        } else {
          return result;
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
