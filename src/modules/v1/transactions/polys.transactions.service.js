const BramblHelper = require("../../../lib/bramblHelper");
const stdError = require("../../../core/standardError");
const transactionsServiceHelper = require("./transactionsServiceHelper");
const PolyTransfer = require("../../../modifier/transaction/polyTransfer");
const TransferTransactionValidator = require("../../../modifier/transaction/transferTransactionValidator");
const { getObjectDiff } = require("../../../util/extensions");

const serviceName = "polyTransaction";

class PolyTransactionService {
  static async generateRawPolyTransfer(args) {
    return PolyTransfer.createRaw(
      Object.entries(args.recipients),
      args.senders,
      args.changeAddress,
      args.fee,
      args.data
    ).then(function(value) {
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

  static async polyTransactionHelper(bramblHelper, args) {
    return bramblHelper
      .sendRawPolyTransaction(args)
      .then(function(rpcResponse) {
        if (rpcResponse.error) {
          return rpcResponse;
        } else {
          return PolyTransactionService.generateRawPolyTransfer(args).then(
            function(jsResponse) {
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
                return transactionsServiceHelper.signAndSendTransactionWithStateManagement(
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
      args.addresses = await transactionsServiceHelper.addAddressesToDBFromTransaction(
        bramblHelper,
        args
      );
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
