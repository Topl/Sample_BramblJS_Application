const TransferTransaction = require("./transferTransaction");
const PolyBox = require("../../lib/boxes/polyBox");
const SimpleValue = require("../../lib/boxes/simpleValue");

class PolyTransfer extends TransferTransaction {
  typePrefix = 2;
  typeString = "PolyTransfer";

  constructor(from, newBoxes, attestation, fee, timestamp, data, proposition) {
    super(from, newBoxes, attestation, fee, timestamp, data);

    this.coinOutput = newBoxes.map(recipient => {
      // grabbing the value of the polys that will be put in the recipient's box
      return new PolyBox(recipient[1].quantity);
    });

    this.feeChangeOutput = new PolyBox(
      new SimpleValue(newBoxes[0][1].quantity)
    );
  }

  static async createRaw(toReceive, senders, changeAddress, fee, data) {
    let obj = {};
    let self = this;

    return TransferTransaction.getSenderBoxesAndCheckPolyBalance(
      senders,
      fee,
      "Polys"
    ).then(function(txInputState) {
      if (txInputState.error) {
        return txInputState;
      }
      // compute the amount of tokens to be sent to the recipients
      const amtToSpend = toReceive
        .map(r => {
          return r[1].quantity;
        })
        .reduce((a, b) => +a + +b, 0);

      // create the list of inputs and outputs
      const inputOutputObj = self.ioTransfer(
        txInputState,
        toReceive,
        changeAddress,
        fee,
        amtToSpend
      );

      // ensure there are sufficient funds from the sender boxes to create all outputs
      if (inputOutputObj.availableToSpend < amtToSpend) {
        obj.error = "Insufficient funds available to create transaction.";
        return obj;
      }
      return new PolyTransfer(
        inputOutputObj.inputs,
        inputOutputObj.outputs,
        new Map(),
        fee,
        Date.now(),
        data
      );
    });
  }

  static ioTransfer(txInputState, toReceive, changeAddress, fee, amtToSpend) {
    let obj = {};
    const availableToSpend = txInputState.polyBalance - +fee;
    const inputs = txInputState.senderBoxes.map(bx => {
      return [bx.address, bx.nonce];
    });
    const outputs = [
      [
        changeAddress,
        {
          type: "Simple",
          quantity: txInputState.polyBalance - +fee - amtToSpend
        }
      ]
    ]
      .concat(toReceive)
      .filter(out => {
        return out[1].quantity > 0;
      });
    obj.availableToSpend = availableToSpend;
    obj.inputs = inputs;
    obj.outputs = outputs;
    return obj;
  }
}

module.exports = PolyTransfer;
