const BramblHelper = require("../../../lib/bramblHelper");
const RequestValidator = require("../../../lib/requestValidator");
const stdError = require("../../../core/standardError");
const { checkExistsByAddress } = require("../../../lib/validation");
const AddressesService = require("../addresses/addresses.service");
const Address = require("../addresses/addresses.model");

const serviceName = "readTransactions";

class ReadTransactionService {
  static async getBalanceHelper(bramblHelper, args) {
    let addressInfo;
    if (bramblHelper.brambljs) {
      addressInfo = await bramblHelper.getBoxesWithBrambl([args.address]);
    } else {
      addressInfo = await bramblHelper.getBoxesWithRequests([args.address]);
    }
    if (addressInfo.error) {
      throw stdError(500, addressInfo.error, serviceName, serviceName);
    }
    return AddressesService.updateAddressByAddress({
      name: args.name,
      addressId: args.address,
      polyBalance: addressInfo.result[args.address].Balances.Polys,
      polyBox: addressInfo.result[args.address].Boxes.PolyBox,
      arbitBox: addressInfo.result[args.address].Boxes.ArbitBox,
      assetBox: addressInfo.result[args.address].Boxes.AssetBox,
    }).then(function (result) {
      if (result.error) {
        throw stdError(500, result.error, serviceName, serviceName);
      } else {
        return addressInfo;
      }
    });
  }

  static async getBalances(args) {
    const bramblHelper = new BramblHelper(true, args.network);
    let address = "";
    address =
      args.address &&
      RequestValidator.validateAddresses([args.address], args.network)
        ? args.address
        : false;
    if (!address) {
      throw stdError(404, "Unable to find address", serviceName, serviceName);
    } else {
      // check if address exists in the db
      return checkExistsByAddress(Address, address) // eslint-disable-next-line no-unused-vars
        .then(function (result) {
          // if the address is not in the db, add to the db
          if (result.error) {
            return (
              AddressesService.create({
                network: args.network,
                password: args.password,
                name: args.name,
                userEmail: args.userEmail,
                address: args.address,
                // eslint-disable-next-line no-unused-vars
              })
                // eslint-disable-next-line no-unused-vars
                .then(function (result) {
                  return ReadTransactionService.getBalanceHelper(
                    bramblHelper,
                    args
                  );
                })
                .catch(function (err) {
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
            return ReadTransactionService.getBalanceHelper(bramblHelper, args);
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
}

module.exports = ReadTransactionService;
