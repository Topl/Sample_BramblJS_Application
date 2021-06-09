const { checkExists } = require("../../../lib/validation");
const Address = require("../addresses/addresses.model");
const AddressesService = require("../addresses/addresses.service");
const ReadTransactionService = require("./read.transactions.service");
const BoxUtils = require("../../../lib/boxes/boxUtils");
const stdError = require("../../../core/standardError");
const BramblJS = require("brambljs");
const BramblHelper = require("../../../lib/bramblHelper");

const serviceName = "TransactionServiceHelper";

class TransactionServiceHelper {
    static async addAddressesToDBFromTransaction(args) {
        try {
            for (const address of args.addresses) {
                await checkExists(Address, address, "address").then(function (result) {
                    if (result.error === "address not found in db") {
                        return AddressesService.create({
                            network: args.network,
                            password: args.password,
                            name: args.name,
                            userEmail: args.userEmail,
                            address: address,
                        });
                    }
                });
            }
            return args.addresses;
        } catch (error) {
            console.error(error);
            throw stdError(400, "Error saving new address to the db", error, serviceName);
        }
    }

    static async getKeyfileForAddresses(addresses) {
        // iterate through all the sender addresses, checking whether or not their keyfiles are stored in the DB. If they are, return a list of the [address, keyfile] tuples, else return an exception that the keyfiles are not found in the db.
        const keyfiles = [];
        let obj = {};
        for (const address of addresses) {
            await AddressesService.getAddressByAddress({
                address: address,
            })
                .then(function (result) {
                    keyfiles.push({
                        address: address,
                        keyfile: result.keyfile,
                    });
                })
                .catch(function (err) {
                    if (err.status === 404) {
                        // Address not found in DB, fall back option to resolve from chain
                        // Once the keyfile for this address has been resolved, we will add it to the DB
                        keyfiles.push({
                            address: address,
                        });
                    } else {
                        console.error(err);
                        obj.error = err.message;
                        return obj;
                    }
                });
        }
        return keyfiles;
    }

    static async extractParamsAndAddAddressesToDb(bramblHelper, args, serviceName) {
        let obj = {};
        const bramblParams = await bramblHelper.verifyRawTransactionData(args).catch(function (err) {
            console.error(err);
            obj.error = err.message;
            return obj;
        });

        if (bramblParams.error) {
            return bramblParams;
        }

        // sender addresses were checked to be in the DB in a previous step, no need to do that computation for a second time.
        const temp = bramblParams.sender;
        bramblParams.sender = null;
        bramblParams.addresses = BramblJS.utils
            .extractAddressesFromObj(bramblParams)
            .filter(function (value, index, self) {
                return self.indexOf(value) === index;
            }); // uniqueness filter
        bramblParams.sender = temp;
        await TransactionServiceHelper.addAddressesToDBFromTransaction(bramblParams).then(function (result) {
            if (result.error) {
                throw stdError(500, result.error, serviceName, serviceName);
            } else {
                return result;
            }
        });
        return bramblParams;
    }

    static async initiateBramblHelperFromRequest(args) {
        let senderKeyManagers = [];
        let bramblHelperParams;
        const result = await this.getKeyfileForAddresses(Object.keys(args.sender));
        if (result.error) {
            throw stdError(500, result.error, serviceName, serviceName);
        }
        //partitions the result based on whether a keyfile was found in the db
        const [addressesWithKeyfilesInDB, addressesWithoutKeyfilesInDB] = result.reduce(
            ([p, f], e) => (e.keyfile ? [[...p, e], f] : [p, [...f, e]]),
            [[], []]
        );
        if (addressesWithoutKeyfilesInDB.length > 0) {
            for (const keyStorage of addressesWithoutKeyfilesInDB) {
                const kM = BramblJS.KeyManager.importKeyPairFromFile(
                    `private_keyfiles/${keyStorage.address}.json`,
                    args.password
                );
                senderKeyManagers.push(kM);
                await AddressesService.create({
                    network: args.network,
                    password: args.sender[keyStorage.address],
                    name: `${keyStorage.address}`,
                    userEmail: args.userEmail,
                    address: keyStorage.address,
                    keyfile: kM.getKeyStorage(),
                });
            }
        }
        if (senderKeyManagers.length > 0) {
            bramblHelperParams = {
                readOnly: false,
                network: args.network,
                keyManager: senderKeyManagers[0],
            };
        } else {
            bramblHelperParams = {
                readOnly: false,
                network: args.network,
                password: args.sender[addressesWithKeyfilesInDB[0].address],
                keyFile: addressesWithKeyfilesInDB[0].keyfile,
            };
        }
        const bramblHelper = new BramblHelper(bramblHelperParams);
        args.keyfiles = senderKeyManagers
            .map(function (manager) {
                return manager.getKeyStorage();
            })
            .concat(addressesWithKeyfilesInDB.map((keyStorage) => keyStorage.keyfile));
        return [bramblHelper, args];
    }

    static async signAndSendTransactionWithStateManagement(rawTransaction, bramblHelper, args) {
        let obj = {};
        obj.result = await bramblHelper
            .signAndSendTransaction(rawTransaction)
            // eslint-disable-next-line no-unused-vars
            .then(function (transactionResult) {
                obj.txId = transactionResult.txId;
                return Promise.all(
                    args.addresses.map(function (address) {
                        const internalObj = {};
                        const internalArgs = {
                            address: address,
                            network: args.network,
                            password: args.senderPasswords[0],
                            polyBalance: BoxUtils.calculatePolyBalance(transactionResult.result.newBoxes),
                        };
                        return ReadTransactionService.getBalanceHelper(internalArgs)
                            .then(function (result) {
                                internalObj.balance = result;
                                return internalObj;
                            })
                            .catch(function (err) {
                                console.error(err);
                                internalObj.err = err.message;
                                return internalObj;
                            });
                    })
                ).catch(function (err) {
                    console.error(err);
                    obj.err = err.message;
                    return obj;
                });
            });

        return obj;
    }
}

module.exports = TransactionServiceHelper;
