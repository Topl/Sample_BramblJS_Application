const BramblHelper = require("../../../lib/bramblHelper");
const stdError = require("../../../core/standardError");
const PolyTransfer = require("../../../modifier/transaction/polyTransfer");
const TransferTransactionValidator = require("../../../modifier/transaction/transferTransactionValidator");
const { getObjectDiff } = require("../../../util/extensions");
const TransactionsServiceHelper = require("./transactionsServiceHelper");

const serviceName = "polyTransaction";

class PolyTransactionService {
  static async generateRawPolyTransfer(args) {
    return PolyTransfer.createRaw(
      args.recipients,
      args.sender,
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

  static async polyTransaction(args) {
    const bramblHelper = new BramblHelper(
      false,
      args.password,
      args.network,
      args.keyFilePath
    );
    if (bramblHelper) {
      // iterate through all sender, recipient, and change addresses, checking whether or not they are in the DB
      const bramblParams = await TransactionsServiceHelper.extractParamsAndAddAddressesToDb(
        bramblHelper,
        args
      );
      return PolyTransactionService.polyTransactionHelper(
        bramblHelper,
        bramblParams
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
