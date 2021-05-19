const BoxService = require("./box.service");
const BoxModel = require("./box.model");
const { checkExistsByBifrostId } = require("../../../lib/validation");

class BoxHelper {
  static async updateBoxes(boxes, address) {
    return boxes.forEach(box => {
      checkExistsByBifrostId(BoxModel, box.id).then(function(result) {
        if (result.error) {
          return BoxService.saveToDb({
            address: address,
            nonce: box.nonce,
            bifrostId: box.id,
            evidence: box.evidence,
            boxType: box.type,
            value: box.value
          });
        } else {
          return BoxService.updateBoxById({
            address: address,
            nonce: box.nonce,
            evidence: box.evidence,
            value: box.value,
            id: box.id
          }).then(function(result) {
            return result;
          });
        }
      });
    });
  }
}

module.exports = BoxHelper;
