class AssetBox {
  typePrefix = 3;
  typeString = "AssetBox";

  constructor(value, evidence, nonce, id) {
    this.id = id;
    this.evidence = evidence;
    this.nonce = nonce;
    this.value = value;
  }
}

module.exports = AssetBox;
