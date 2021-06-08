class AssetBox {
  typePrefix = 3;
  typeString = "AssetBox";

  constructor(evidence, nonce, value) {
    this.evidence = evidence;
    this.nonce = nonce;
    this.value = value;
  }
}

module.exports = AssetBox;
