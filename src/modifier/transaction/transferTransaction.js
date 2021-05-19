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

module.exports = TransferTransaction;
