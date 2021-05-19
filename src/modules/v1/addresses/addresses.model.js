const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: false
  },
  user_id: {
    type: String,
    required: false
  },
  network: {
    type: String,
    required: true
  },
  polyBalance: {
    type: String,
    required: true
  },
  arbitBoxes: [
    {
      type: mongoose.Schema.Types.Mixed,
      required: false,
      nonce: {
        type: String,
        required: true
      },
      id: {
        type: String,
        required: true
      },
      evidence: {
        type: String,
        required: true
      },
      value: {
        type: mongoose.Schema.Types.Mixed,
        arbitType: {
          type: String,
          required: true
        },
        quantity: {
          type: String,
          required: true
        }
      }
    }
  ],
  assetBox: [
    {
      type: mongoose.Schema.Types.Mixed,
      required: false,
      nonce: {
        type: String,
        required: true
      },
      evidence: {
        type: String,
        required: true
      },
      id: {
        type: String,
        required: true
      },
      value: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        quantity: {
          type: String,
          required: true
        },
        assetCode: {
          type: String,
          required: true
        },
        metadata: {
          type: String,
          required: false
        },
        securityRoot: {
          type: String,
          required: false
        }
      }
    }
  ],
  polyBox: [
    {
      type: mongoose.Schema.Types.Mixed,
      required: false,
      nonce: {
        type: String,
        required: true
      },
      id: {
        type: String,
        required: true
      },
      evidence: {
        type: String,
        required: true
      },
      value: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        polyType: {
          type: String,
          required: true
        },
        quantity: {
          type: String,
          required: true
        }
      }
    }
  ],
  keyfile: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
    address: {
      type: String,
      required: true
    },
    crypto: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      mac: {
        type: String,
        required: true
      },
      kdf: {
        type: String,
        required: true
      },
      cipherText: {
        type: String,
        required: true
      },
      kdfSalt: {
        type: String,
        required: true
      },
      cipher: {
        type: String,
        required: true
      },
      cipherParams: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        iv: {
          type: String,
          required: true
        }
      }
    }
  },
  isActive: {
    type: mongoose.Schema.Types.Mixed,
    status: {
      type: Boolean,
      default: true
    },
    asOf: {
      type: Date
    },
    required: true
  }
});

// eslint-disable-next-line no-undef
module.exports = Address = mongoose.model("address", AddressSchema);
