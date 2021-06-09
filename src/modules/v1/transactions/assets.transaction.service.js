/**
 * @author Sterling Wells (s.wells@topl.me)
 * @version 1.0.0
 * @date 2021.05.27
 */

const BramblHelper = require("../../../lib/bramblHelper");
const AssetTransfer = require("../../../modifier/transaction/assetTransfer");
const TransferTransactionValidator = require("../../../modifier/transaction/transferTransactionValidator");
const stdError = require("../../../core/standardError");
const Constants = require("../../../util/constants");
const { getObjectDiff } = require("../../../util/extensions");
const TransactionsServiceHelper = require("./transactionsServiceHelper");

const serviceName = "AssetTransaction";

/**
 * @class
 * @classdesc Asset Transaction Service used for Asset Transactions with the Topl Protocol
 */
class AssetTransactionService {
    static async generateRawAssetTransfer(args, bramblHelper) {
        return AssetTransfer.createRaw(
            args.recipients,
            args.sender,
            args.changeAddress,
            args.consolidationAddress,
            args.fee,
            args.data,
            args.minting,
            args.assetCode,
            bramblHelper
        ).then(function (value) {
            if (value.error) {
                return value;
            } else {
                // validate tx
                const txValidator = new TransferTransactionValidator(value);
                const txValid = txValidator.rawSyntacticValidation();
                if (txValid.error) {
                    return txValid;
                } else {
                    return value;
                }
            }
        });
    }

    /**
     * Helper function for asset transfers
     * @static
     * @param {object} bramblHelper instance
     * @param {object} args request parameters
     * @returns {object} new asset transaction response from the network
     * @memberof AssetTransactionService
     */
    static async assetTransferHelper(bramblHelper, args) {
        return bramblHelper.sendRawAssetTransaction(args).then(function (rpcResponse) {
            if (rpcResponse.err) {
                throw stdError(403, rpcResponse.error, serviceName, serviceName);
            }
            return AssetTransactionService.generateRawAssetTransfer(args, bramblHelper).then(function (jsResponse) {
                if (jsResponse.error) {
                    return jsResponse;
                }
                const rawTransferTransaction = new AssetTransfer(
                    rpcResponse.messageToSign.result.rawTx.from,
                    rpcResponse.messageToSign.result.rawTx.to,
                    new Map(),
                    rpcResponse.messageToSign.result.rawTx.fee,
                    jsResponse.timestamp,
                    rpcResponse.messageToSign.result.rawTx.data,
                    rpcResponse.messageToSign.result.rawTx.minting
                );
                if (getObjectDiff(jsResponse, rawTransferTransaction)) {
                    return TransactionsServiceHelper.signAndSendTransactionWithStateManagement(
                        rpcResponse,
                        bramblHelper,
                        args
                    );
                } else {
                    throw stdError(500, "Invalid RPC Response", serviceName, serviceName);
                }
            });
        });
    }

    /**
     * Main function for creating an asset
     * @static
     * @param {object} args: Request parameters
     * @returns {object} returns the instance of the asset creation transaction
     * @memberof AssetTransactionService
     */
    static async createAsset(args) {
        let bramblHelper;
        [bramblHelper, args] = await TransactionsServiceHelper.initiateBramblHelperFromRequest(args);
        args.address = bramblHelper.brambljs.keyManager.address;
        if (bramblHelper) {
            // iterate through all recipient, and change addresses checking whether or not they are in the DB
            const bramblParams = await TransactionsServiceHelper.extractParamsAndAddAddressesToDb(bramblHelper, args);

            bramblParams.assetCode = bramblHelper.createAssetValue(args.name);
            return AssetTransactionService.assetTransferHelper(bramblHelper, bramblParams).then(function (result) {
                if (result.error) {
                    throw stdError(500, result.error, serviceName, serviceName);
                } else {
                    return result;
                }
            });
        } else {
            throw stdError(404, "Missing or Invalid KeyfilePath", serviceName, serviceName);
        }
    }

    /**
     * Main function for updating an asset on the chain
     * @param {object} args: request parameters used to format the JSON-RPC request
     * @returns {object} new asset transaction response from the network
     * @memberof AssetTransactionService
     */
    static async updateAsset(args) {
        let bramblHelper;
        [bramblHelper, args] = await TransactionsServiceHelper.initiateBramblHelperFromRequest(args);
        args.address = bramblHelper.brambljs.keyManager.address;
        if (bramblHelper) {
            if (args.assetCode) {
                args.minting = false;
                const bramblParams = await TransactionsServiceHelper.extractParamsAndAddAddressesToDb(
                    bramblHelper,
                    args
                );
                bramblParams.assetCode = args.assetCode;
                return AssetTransactionService.assetTransferHelper(bramblHelper, bramblParams);
            } else {
                throw stdError(404, "Missing or Invalid Asset Code", serviceName, serviceName);
            }
        }
    }

    /**
     * Main function for burning assets
     * @param {object} args: Request parameters
     * @returns {object} returns the instance of the asset creation transaction
     * @memberof AssetTransactionService
     */
    static async burnAsset(args) {
        let bramblHelper;
        [bramblHelper, args] = await TransactionsServiceHelper.initiateBramblHelperFromRequest(args);
        args.address = bramblHelper.brambljs.keyManager.address;
        if (bramblHelper) {
            if (args.assetCode) {
                args.recipients = [[Constants.BURNER_ADDRESS, { quantity: args.quantity }]];
                args.minting = false;
                const bramblParams = await TransactionsServiceHelper.extractParamsAndAddAddressesToDb(
                    bramblHelper,
                    args
                );
                bramblParams.assetCode = args.assetCode;
                return AssetTransactionService.assetTransferHelper(bramblHelper, bramblParams);
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
