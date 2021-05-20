const BoxReader = require("../../lib/boxes/boxReader");
const PolyBox = require("../../lib/boxes/polyBox");
const AssetBox = require("../../lib/boxes/assetBox");
const ArbitBox = require("../../lib/boxes/arbitBox");
const { asyncFlatMap } = require("../../util/extensions");

class TransferTransaction {

  constructor(from, to, attestation, fee, timestamp, data, minting) {
    this.from = from;
    this.to = to;
    this.attestation = attestation;
    this.fee = fee;
    this.timestamp = timestamp;
    this.data = data;
    this.minting = minting;

    this.newBoxes = {
      // this only creates an output if the value of the output boxes is non-zero

    }
  }

  calculateBoxNonce(tx, to) {
    // known input data (similar to messageToSign but without newBoxes since they are not known yet)
    const txIdPrefix = tx.typePrefix;

  }

  static async getSenderBoxesForRawTransaction(
    addresses,
    returnBoxes,
    assetCode
  ) {
    let obj = {};
    // Lookup boxes for the given sender addresses
    return asyncFlatMap(addresses, a => {
      return BoxReader.getTokenBoxes(a).then(function(result) {
        // Throw an error if there are no boxes.
        if (result.length < 1) {
          obj.error = "No boxes found to fund transactions";
          return obj;
        }
        return result.reduce((acc, value) => {
          // implement grouping
          // always get polys since this is how fees are paid
          if (value.type === "PolyBox") {
            acc.push(new PolyBox(value.evidence, value.nonce, value.value));
          } else if (value.type === "ArbitBox" && returnBoxes === "ArbitBox") {
            acc.push(new ArbitBox(value.evidence, value.nonce, value.value));
          } else if (
            value.type === "AssetBox" &&
            returnBoxes === "AssetBox" &&
            assetCode === value.value.assetCode
          ) {
            acc.push(new AssetBox(value.evidence, value.nonce, value.value));
          }
        });
      });
    });
  }

  static async getSenderBoxesAndCheckPolyBalance(
    senders,
    fee,
    txType,
    assetCode
  ) {
    let obj = {};
    // Lookup boxes for the given senders
    const senderBoxes = await TransferTransaction.getSenderBoxesForRawTransaction(
      senders,
      txType,
      assetCode
    );

    // compute poly balance since it is used often

    const polyBalance = senderBoxes
      .filter(s => s.typePrefix == 2)
      .map(s => s.value.quantity)
      .reduce((a, b) => a + b, 0);

    // ensure there are enough polys to pay the fee
    if (polyBalance < fee) {
      obj.error = "Insufficient funds to pay transaction fee";
    }

    return { senderBoxes: senderBoxes, polyBalance: polyBalance };
  }
}

TransferTransaction.prototype.equals = function(o) {
  return (
    this.from === o.from &&
    this.to === o.to &&
    this.attestation === o.attestation &&
    this.fee === o.fee &&
    this.data === o.data &&
    this.minting === o.minting
  );
};

module.exports = TransferTransaction;
