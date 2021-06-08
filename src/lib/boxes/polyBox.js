class PolyBox {
  typePrefix = 2;
  typeString = "PolyBox";

  constructor(evidence, nonce, value) {
    this.evidence = evidence;
    this.nonce = nonce;
    this.value = value;
  }
}

module.exports = PolyBox;
