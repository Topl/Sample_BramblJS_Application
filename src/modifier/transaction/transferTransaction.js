class TransferTransaction {
  constructor(from, to, attestation, fee, timestamp, data, minting) {
    this.from = from;
    this.to = to;
    this.attestation = attestation;
    this.fee = fee;
    this.timestamp = timestamp;
    this.data = data;
    this.minting = minting;
  }
}

TransferTransaction.prototype.equals = function(o) {
  return (
    this.from === o.from &&
    this.to === o.to &&
    this.attestation === o.attestation &&
    this.fee === o.fee &&
    this.data === o.data &&
    this.minting === o.minting
  );
};

module.exports = TransferTransaction;
