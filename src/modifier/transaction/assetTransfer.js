const TransferTransaction = require("./transferTransaction");
const AssetBox = require("../../lib/boxes/assetBox");

class AssetTransfer extends TransferTransaction {
  typePrefix = 3;
  typeString = "AssetTransfer";

  constructor(from, to, attestation, fee, timestamp, data, minting) {
    super(from, to, attestation, fee, timestamp, data, minting);

    this.coinOutput = to.map(recipient => {
      // grabbing the value of the assets that will be put in the recipient's box
      return new AssetBox(recipient.value);
    });
  }

  generateNewBoxes() {
    const recipientCoinOutput = this.coinOutput.filter(
      r => r.value.quantity > 0
    );
    const hasRecipientOutput = recipientCoinOutput.length > 0;
  }
}

module.exports = AssetTransfer;
