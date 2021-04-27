const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  jsonrpc: {
    type: String,
    required: true
  },
  txType: {
    type: String,
    required: true
  },
  dateCreated: {
    type: Date,
    required: true,
    description: "Date and time the transaction was created"
  },
  signatures: {
    type: String,
    description:
      "A reference to the signatures attached to a broadcasted transaction"
  },
  newBoxes: [
    {
      type: mongoose.Schema.Types.Mixed,
      nonce: {
        type: String,
        required: true
      },
      evidence: {
        type: String,
        required: true
      },
      boxType: {
        type: mongoose.Schema.Types.Mixed,
        boxType: {
          type: String,
          required: true
        },
        quantity: {
          type: String,
          required: true
        },
        assetCode: {
          type: String
        },
        metadata: {
          type: String
        },
        securityRoot: {
          type: String
        }
      }
    }
  ],
  data: {
    type: String
  },
  recipients: [
    {
      type: mongoose.Schema.Types.Mixed,
      recipientType: {
        type: String,
        required: true
      },
      quantity: {
        type: String,
        required: true
      },
      assetCode: {
        type: String
      },
      metadata: {
        type: String
      },
      securityRoot: {
        type: String
      }
    }
  ],
  propositionType: {
    type: String,
    required: true
  },
  from: {
    type: String,
    required: true
  },
  minting: {
    type: Boolean,
    required: true
  },
  txId: {
    type: String,
    required: true
  },
  feeOffered: {
    type: String,
    required: true
  }
});

//eslint-disable-next-line no-undef
module.exports = Transaction = mongoose.model("transaction", TransactionSchema);
