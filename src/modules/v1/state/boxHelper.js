const BoxService = require("./box.service");
const BoxModel = require("./box.model");
const { checkExists } = require("../../../lib/validation");

class BoxHelper {
  static async updateBoxes(boxes, address) {
    let obj = {};
    return boxes.forEach(box => {
      checkExists(BoxModel, box.id, "bifrostId").then(function(result) {
        if (result.error) {
          return BoxService.saveToDb({
            address: address,
            nonce: box.nonce,
            bifrostId: box.id,
            evidence: box.evidence,
            boxType: box.type,
            value: box.value
          }).catch(function(err) {
            console.error(err);
            obj.error = err.message;
            return obj;
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
