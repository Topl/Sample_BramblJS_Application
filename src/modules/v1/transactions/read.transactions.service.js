const BramblHelper = require("../../../lib/bramblHelper");
const RequestValidator = require("../../../lib/requestValidator");
const stdError = require("../../../core/standardError");
const { checkExists } = require("../../../lib/validation");
const AddressesService = require("../addresses/addresses.service");
const Address = require("../addresses/addresses.model");

const serviceName = "readTransactions";

class ReadTransactionService {
    static async getBalanceHelper(args) {
        return AddressesService.updateAddressByAddress({
            name: args.name,
            addressId: args.address,
            network: args.network,
            password: args.password,
            polyBalance: args.polyBalance,
        }).then(function (result) {
            if (result.error) {
                throw stdError(500, result.error, serviceName, serviceName);
            } else {
                return result;
            }
        });
    }

    static async getBalances(args) {
        let address = "";
        address =
            args.address && RequestValidator.validateAddresses([args.address], args.network) ? args.address : false;
        if (!address) {
            throw stdError(404, "Unable to find address", serviceName, serviceName);
        } else {
            // check if address exists in the db
            return checkExists(Address, address, "address") // eslint-disable-next-line no-unused-vars
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
                                    return ReadTransactionService.getBalanceHelper(args);
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
                        return ReadTransactionService.getBalanceHelper(args);
                    }
                });
        }
    }

    static async getBlockNumber(args) {
        const bramblHelperParams = {
            readOnly: true,
            network: args.network,
        };
        const bramblHelper = new BramblHelper(bramblHelperParams);
        return await bramblHelper.getBlockNumber();
    }

    static async getBlock(args) {
        const bramblHelperParams = {
            readOnly: true,
            network: args.network,
        };
        const bramblHelper = new BramblHelper(bramblHelperParams);
        return await bramblHelper.getBlock(args.blockNumber);
    }

    static async getTransactionFromMempool(args) {
        const bramblHelperParams = {
            readOnly: true,
            network: args.network,
        };
        const bramblHelper = new BramblHelper(bramblHelperParams);
        return await bramblHelper.getTransactionFromMempool(args.transactionId);
    }

    static async getTransactionFromBlock(args) {
        const bramblHelperParams = {
            readOnly: true,
            network: args.network,
        };
        const bramblHelper = new BramblHelper(bramblHelperParams);
        return await bramblHelper.getTransactionFromBlock(args.transactionId);
    }
}

module.exports = ReadTransactionService;
