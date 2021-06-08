class ArbitBox {
  typePrefix = 1;
  typeString = "ArbitBox";

  constructor(evidence, nonce, value, id) {
    this.id = id;
    this.evidence = evidence;
    this.nonce = nonce;
    this.value = value;
  }
}

module.exports = ArbitBox;
