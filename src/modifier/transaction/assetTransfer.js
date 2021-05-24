const TransferTransaction = require("./transferTransaction");
const AssetBox = require("../../lib/boxes/assetBox");
const PolyBox = require("../../lib/boxes/polyBox");
const SimpleValue = require("../../lib/boxes/simpleValue");
const AssetValue = require("../../lib/boxes/assetValue");
const MAX_INTEGER_VALUE = require("../../util/constants").MAX_INTEGER_VALUE;

class AssetTransfer extends TransferTransaction {
  typePrefix = 3;
  typeString = "AssetTransfer";

  constructor(
    from,
    newBoxes,
    attestation,
    fee,
    timestamp,
    data,
    minting,
    proposition
  ) {
    super(from, newBoxes, attestation, fee, timestamp, data, minting);

    this.coinOutput = newBoxes.map(recipient => {
      // grabbing the value of the assets that will be put in the recipient's box
      return new AssetBox(recipient[1].quantity);
    });

    this.feeChangeOutput = new PolyBox(
      new SimpleValue(newBoxes[0][1].quantity)
    );
  }

  generateNewBoxes() {
    const recipientCoinOutput = this.coinOutput.filter(
      r => r.value.quantity > 0
    );
    const hasRecipientOutput = recipientCoinOutput.length > 0;
    const hasFeeChangeOutput = this.feeChangeOutput.value.quantity > 0;

    if (hasRecipientOutput && !hasFeeChangeOutput) return recipientCoinOutput;
    if (hasRecipientOutput && hasFeeChangeOutput)
      return new Array(this.feeChangeOutput).concat(recipientCoinOutput);
  }

  static async createRaw(
    toReceive,
    senders,
    changeAddress,
    consolidationAddress,
    fee,
    data,
    minting
  ) {
    let obj = {};
    let self = this;
    const assetSet = new Set(
      toReceive.map(r => {
        return r.assetCode;
      })
    );
    if (assetSet.size > 1) {
      obj.error = "Found multiple asset codes when only one was expected";
      return obj;
    }
    const assetCode = Array.from(assetSet)[0];
    return TransferTransaction.getSenderBoxesAndCheckPolyBalance(
      senders,
      fee,
      "Assets",
      assetCode
    ).then(function(result) {
      if (result.error) {
        return result;
      }
      // compute the amount of tokens that will be sent to the recipient
      const amtToSpend = toReceive
        .map(r => {
          return r[1];
        })
        .reduce((a, b) => +a + +b, 0);

      // create the list of inputs and outputs (senderChangeOut and recipientOut)
      const inputOutputObj = minting
        ? self.ioMint(result, toReceive, changeAddress, fee)
        : self.ioTransfer(
            result,
            toReceive,
            changeAddress,
            consolidationAddress,
            fee,
            amtToSpend,
            assetCode
          );

      // ensure there are sufficient funds from the sender boxes to create all outputs
      if (inputOutputObj.availableToSpend < amtToSpend) {
        obj.error = "Insufficient funds available to create transaction.";
        return obj;
      }
      return new AssetTransfer(
        inputOutputObj.inputs,
        inputOutputObj.outputs,
        new Map(),
        fee,
        Date.now(),
        data,
        minting
      );
    });
  }

  static ioTransfer(
    txInputState,
    toReceive,
    changeAddress,
    consolidationAddress,
    fee,
    amtToSpend,
    assetCode
  ) {
    let obj = {};
    let assetBoxes = txInputState.senderBoxes.filter(
      box => box.boxType === "AssetBox"
    );
    if (assetBoxes.length < 1) {
      obj.error = `No Assets Found with assetCode ${assetCode}`;
      return obj;
    }

    const availableToSpend = assetBoxes
      .map(box => box.value.quantity)
      .reduce((a, b) => a + b, 0);
    // create the list of inputs and outputs (senderChangeOut and recipientOut)
    const inputs = assetBoxes
      .map(bx => {
        return {
          value: bx.address,
          nonce: bx.nonce
        };
      })
      .concat(
        txInputState.senderBoxes
          .filter(box => box.boxType === "PolyBox")
          .map(bx => {
            return [bx.address, bx.nonce];
          })
      );

    const outputs = [
      [
        changeAddress,
        {
          type: "Simple",
          quantity: (txInputState.polyBalance - +fee).toString()
        }
      ],
      [
        consolidationAddress,
        new AssetValue((availableToSpend - amtToSpend).toString(), assetCode)
      ]
    ].concat(toReceive);
    obj.availableToSpend = availableToSpend;
    obj.inputs = inputs;
    obj.outputs = outputs;
    return obj;
  }

  static ioMint(txInputState, toReceive, changeAddress, fee) {
    // you cannot mint more than the max number that bifrost can represent
    const retVal = {};
    const availableToSpend = MAX_INTEGER_VALUE;
    const inputs = txInputState.senderBoxes
      .filter(box => box.boxType === "PolyBox")
      .map(bx => {
        return [bx.address, bx.nonce];
      });
    const outputs = [
      [
        changeAddress,
        {
          type: "Simple",
          quantity: (txInputState.polyBalance - +fee).toString()
        }
      ]
    ].concat(toReceive);
    retVal.availableToSpend = availableToSpend;
    retVal.inputs = inputs;
    retVal.outputs = outputs;
    return retVal;
  }
}

module.exports = AssetTransfer;
