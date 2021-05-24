const StringOps = require("../../util/extensions");

class TransferTransactionValidator {
  constructor(tx) {
    this.tx = tx;
  }

  rawSyntacticValidation() {
    // this trick works because the spread operator (...) for Array literals does nothing if its operand is an empty array.
    let errors = [
      ...(this.validationByTransactionType()
        ? [this.validationByTransactionType()]
        : []),
      ...(this.feeValidation() ? [this.feeValidation()] : []),
      ...(this.timestampValidation() ? [this.timestampValidation()] : []),
      ...(this.dataValidation() ? [this.dataValidation()] : []),
      ...(this.inputOutputBoxesUniqueValidation()
        ? [this.inputOutputBoxesUniqueValidation()]
        : [])
    ];
    return errors;
  }

  inputOutputBoxesUniqueValidation() {
    if (this.tx.newBoxes.size != new Set(this.tx.newBoxes).size) {
      return "Input/Output Boxes are not unique";
    }
  }

  dataValidation() {
    const dataBuffer = StringOps.getValidLatin1Bytes(this.tx.data);
    if (!dataBuffer) {
      return "Data not Latin-1 encoded";
    }
    if (Buffer.byteLength(dataBuffer) > 128) {
      return "Data greater than 128 bytes";
    }
  }

  timestampValidation() {
    if (this.tx.timestamp < 0) {
      return "Invalid Timestamp";
    }
  }

  feeValidation() {
    if (this.tx.fee < 0) {
      return "Negative Fee attached to transaction";
    }
  }

  validationByTransactionType() {
    if (this.tx?.txType === "Poly") {
      if (this.tx?.from?.length < 0) {
        return "No Input Boxes Specified";
      }
    }
    if (this.tx?.txType === "Asset") {
      if (this.tx?.from?.length < 0) {
        return "No Input Boxes Specified";
      } else if (this.tx?.to?.length < 2) {
        return "Insufficient Outputs for Asset Transaction";
      }
    }
  }
}

module.exports = TransferTransactionValidator;
