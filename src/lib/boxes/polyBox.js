class PolyBox {
  typePrefix = 2;
  typeString = "PolyBox";

  constructor(value) {
    //add evidence and nonce values once the serializers are available in JS
    this.value = value;
  }
}

module.exports = PolyBox;
