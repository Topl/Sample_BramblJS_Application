const BramblHelper = require("../../../lib/bramblHelper");
const stdError = require("../../../core/standardError");
const TransactionsServiceHelper = require("./transactionsServiceHelper");

const serviceName = "polyTransaction";

class PolyTransactionService {
  static async polyTransactionHelper(bramblHelper, args) {
    return bramblHelper.sendRawPolyTransaction(args).then(function(value) {
      if (value.error) {
        return value;
      } else {
        return TransactionsServiceHelper.signAndSendTransactionWithStateManagement(
          value,
          bramblHelper,
          args
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
