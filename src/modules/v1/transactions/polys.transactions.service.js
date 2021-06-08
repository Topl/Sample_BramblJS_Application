
/**
 * @author Sterling Wells (s.wells@topl.me)
 * @version 1.0.0
 * @date 2021.05.27
 */

const BramblHelper = require("../../../lib/bramblHelper");
const stdError = require("../../../core/standardError");
const PolyTransfer = require("../../../modifier/transaction/polyTransfer");
const TransferTransactionValidator = require("../../../modifier/transaction/transferTransactionValidator");
const { getObjectDiff } = require("../../../util/extensions");
const TransactionsServiceHelper = require("./transactionsServiceHelper");

const serviceName = "polyTransaction";

/**
 * @class
 * @classdesc Poly Transaction Service used for Poly Transactions with the Topl Protocol. 
 */
class PolyTransactionService {
  /**
   * Generates the raw poly transfer using the application view
   * @param {object} args: arguments that are required in order to create the raw transaction. Those include the recipients, sender, changeAddress, fee, and data which are provided in the request
   * @returns {object | Boolean} Returns a valid raw transaction, or false if a valid transaction is not possible.
   * @memberof PolyTransactionService
   */
  static async generateRawPolyTransfer(args) {
    return PolyTransfer.createRaw(
      args.recipients,
      args.sender,
      args.changeAddress,
      args.fee,
      args.data
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
   * Helper function for poly transfers
   * @static
   * @param {object} bramblHelper: Instance of the wrapper around the BramblJS library
   * @param {object} args: Request parameters
   * @returns {object} new poly transaction response from the network
   * @memberof PolyTransactionService
   */
  static async polyTransactionHelper(bramblHelper, args) {
    return bramblHelper
      .sendRawPolyTransaction(args)
      .then(function (rpcResponse) {
        if (rpcResponse.error) {
          return rpcResponse;
        } else {
          return PolyTransactionService.generateRawPolyTransfer(args).then(
            function (jsResponse) {
              if (jsResponse.error) {
                return jsResponse;
              }
              const rawTransferTransaction = new PolyTransfer(
                rpcResponse.messageToSign.result.rawTx.from,
                rpcResponse.messageToSign.result.rawTx.to,
                new Map(),
                rpcResponse.messageToSign.result.rawTx.fee,
                jsResponse.timestamp,
                rpcResponse.messageToSign.result.rawTx.data
              );
              if (getObjectDiff(jsResponse, rawTransferTransaction)) {
                return TransactionsServiceHelper.signAndSendTransactionWithStateManagement(
                  rpcResponse,
                  bramblHelper,
                  args
                );
              } else {
                throw stdError(
                  500,
                  "Invalid RPC Response",
                  serviceName,
                  serviceName
                );
              }
            }
          );
        }
      });
  }

  /**
   * Main function for initiating a poly transfer
   * @static
   * @param {object} args: Request parameters
   * @returns {object} returns the instance of the poly transfer transaction.
   * @memberof PolyTransactionService
   */
  static async polyTransaction(args) {
    const bramblHelper = new BramblHelper(
      false,
      args.sender[0][1],
      args.network,
      args.sender[0][0]
    );
    if (bramblHelper) {
      // iterate through all sender, recipient, and change addresses, checking whether or not they are in the DB
      const bramblParams =
        await TransactionsServiceHelper.extractParamsAndAddAddressesToDb(
          bramblHelper,
          args
        );
      return PolyTransactionService.polyTransactionHelper(
        bramblHelper,
        bramblParams
      ).then(function (result) {
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
