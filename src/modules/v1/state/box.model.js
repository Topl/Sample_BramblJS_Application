const mongoose = require("mongoose");

const BoxSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
  },
  nonce: {
    type: String,
    required: true,
    unique: true,
  },
  bifrostId: {
    type: String,
    required: true,
    unique: true,
  },
  evidence: {
    type: String,
    required: true,
  },
  boxType: {
    type: String,
    required: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    valueType: {
      type: String,
      required: true,
    },
    quantity: {
      type: String,
      required: true,
    },
    assetCode: {
      type: String,
      required: false,
    },
    metadata: {
      type: String,
      required: false,
    },
    securityRoot: {
      type: String,
      required: false,
    },
  },
  isActive: {
    type: mongoose.Schema.Types.Mixed,
    status: {
      type: Boolean,
      default: true,
    },
    asOf: {
      type: Date,
    },
    required: true,
  },
});
// eslint-disable-next-line no-undef
module.exports = Box = mongoose.model("box", BoxSchema);
