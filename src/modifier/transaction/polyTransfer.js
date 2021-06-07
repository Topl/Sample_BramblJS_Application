const TransferTransaction = require("./transferTransaction");

class PolyTransfer extends TransferTransaction {
  typePrefix = 2;
  typeString = "PolyTransfer";
}

module.exports = PolyTransfer;
