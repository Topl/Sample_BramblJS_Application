class AssetBox {
  typePrefix = 3;
  typeString = "AssetBox";

  constructor(value) {
    // need the serializers to calculate the evidence and the nonce values;
    this.value = value;
  }
}

module.exports = AssetBox;
