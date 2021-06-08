const BoxModel = require("../../modules/v1/state/box.model");

class BoxUtils {
  static doesBoxArrayContainNonce(array, nonce) {
    return array.some(box => box.nonce === nonce);
  }

  static mapPolyBoxToModel(polyBox, address, timestamp) {
    let boxDoc = {
      address: address,
      evidence: polyBox.evidence,
      bifrostId: polyBox.id,
      nonce: polyBox.nonce,
      boxType: polyBox.type,
      value: polyBox.value
    };

    boxDoc.isActive = {
      status: true,
      asOf: timestamp
    };
    return new BoxModel(boxDoc);
  }
}

module.exports = BoxUtils;
