const MAX_INTEGER_VALUE = require("../../util/constants").MAX_INTEGER_VALUE;
const BramblHelper = require("../../lib/bramblHelper");
const TransferTransaction = require("./transferTransaction");

class RawTransactionHelper {
  static async createRaw(
    toReceive,
    senders,
    changeAddress,
    consolidationAddress,
    fee,
    data,
    minting,
    networkPrefix
  ) {
    let obj = {};
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
    const bramblHelper = new BramblHelper(true, networkPrefix);
    let self = this;
    return bramblHelper
      .getSenderBoxesForRawTransaction(senders, networkPrefix, "Assets", fee)
      .then(function(result) {
        result.map(txState => {
          // compute the amount of tokens that will be sent to the recipient
          const amtToSpend = toReceive
            .map(r => {
              return r.quantity;
            })
            .reduce((a, b) => a + b, 0);

          // create the list of inputs and outputs (senderChangeOut and recipientOut)
          const inputOutputObj = minting
            ? self.ioMint(txState, toReceive, changeAddress, fee)
            : self.ioTransfer(
                txState,
                toReceive,
                changeAddress,
                consolidationAddress,
                fee,
                amtToSpend,
                assetCode
              );

          // ensure there are sufficient funds from the sender boxes to create all outputs
          if (inputOutputObj.availableToSpend > amtToSpend) {
            obj.error = "Insufficient funds available to create transaction.";
            return obj;
          }
          return new TransferTransaction(
            inputOutputObj.inputs,
            inputOutputObj.outputs,
            Map(),
            fee,
            Date.now(),
            data.minting
          );
        });
      });
  }

  ioTransfer(
    txInputState,
    toReceive,
    changeAddress,
    consolidationAddress,
    fee,
    amtToSpend,
    assetCode
  ) {
    let obj = {};
    let availableToSpend;
    if (txInputState["Asset_Box_Data"]) {
      availableToSpend = txInputState["Asset_Box_Data"]
        .map(box => {
          return box.assetBox.value.quantity;
        })
        .reduce((a, b) => a + b, 0);
    } else {
      obj.error = `No Assets found with assetCode ${assetCode}`;
      return obj;
    }
    // create the list of inputs and outputs (senderChangeOut and recipientOut)
    const inputs = txInputState["Asset_Box_Data"]
      .map(bx => {
        return {
          value: bx.senderAddress,
          nonce: bx.assetBox.nonce
        };
      })
      .concat(
        txInputState.senderBoxes.polyBox.map(bx => {
          return {
            value: bx.value,
            nonce: bx.nonce
          };
        })
      );

    const outputs = [
      {
        [changeAddress]: {
          type: "Simple",
          quantity: txInputState.polyBalance - fee
        },
        [consolidationAddress]: {
          type: "Asset",
          quantity: availableToSpend - amtToSpend,
          assetCode: assetCode
        }
      }
    ].concat(toReceive);
    obj.availableToSpend = availableToSpend;
    obj.inputs = inputs;
    obj.outputs = outputs;
  }

  ioMint(txInputState, toReceive, changeAddress, fee) {
    // you cannot mint more than the max number that bifrost can represent
    const retVal = {};
    const availableToSpend = MAX_INTEGER_VALUE;
    const inputs = txInputState.senderBoxes.polyBox.map(bx => {
      let i = {};
      i.value = bx.value;
      i.nonce = bx.nonce;
      return i;
    });
    const changeAddressOutputBox = {
      value: {
        type: "Simple",
        quantity: txInputState.polyBalance - fee
      }
    };
    const outputs = toReceive.push(changeAddressOutputBox);
    retVal.availableToSpend = availableToSpend;
    retVal.inputs = inputs;
    retVal.outputs = outputs;
    return retVal;
  }
}

module.exports = RawTransactionHelper;
