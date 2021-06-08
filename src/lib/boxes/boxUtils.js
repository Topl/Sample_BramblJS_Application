const BoxModel = require("../../modules/v1/state/box.model");
const PolyBox = require("./polyBox");
const AssetBox = require("./assetBox");
const ArbitBox = require("./arbitBox");

class BoxUtils {
  static doesBoxArrayContainNonce(array, nonce) {
    return array.some((box) => box.nonce === nonce);
  }

  static calculatePolyBalance(senderBoxes) {
    return senderBoxes
      .filter((s) => s.typeString === "PolyBox")
      .map((s) => s.value.quantity)
      .reduce((a, b) => +a + +b, 0);
  }

  static convertToBox(box) {
    if (box.type === "PolyBox" || box.boxType === "PolyBox") {
      return new PolyBox(box.evidence, box.nonce, box.value);
    } else if (box.type === "ArbitBox" || box.boxType === "ArbitBox") {
      return new ArbitBox(box.evidence, box.nonce, box.value);
    } else if (box.type === "AssetBox" || box.boxType === "AssetBox") {
      return new AssetBox(box.evidence, box.nonce, box.value);
    }
  }

  static mapPolyBoxToModel(polyBox, address, timestamp) {
    let boxDoc = {
      address: address,
      evidence: polyBox.evidence,
      bifrostId: polyBox.id,
      nonce: polyBox.nonce,
      boxType: polyBox.type,
      value: polyBox.value,
    };

    boxDoc.isActive = {
      status: true,
      asOf: timestamp,
    };
    return new BoxModel(boxDoc);
  }
}

module.exports = BoxUtils;
