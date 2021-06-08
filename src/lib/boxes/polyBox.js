class PolyBox {
  typePrefix = 2;
  typeString = "PolyBox";

  constructor(value, evidence, nonce, id) {
    this.value = value;
    this.id = id;
    this.evidence = evidence;
    this.nonce = nonce;
  }
}

module.exports = PolyBox;
