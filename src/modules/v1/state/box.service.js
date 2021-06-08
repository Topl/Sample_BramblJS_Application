/* eslint-disable no-unused-vars */
const stdError = require("../../../core/standardError");
const BoxModel = require("./box.model");
const BoxUtils = require("../../../lib/boxes/boxUtils");
const save2db = require("../../../lib/db/saveToDatabase");
const { checkExistsById, checkExists } = require("../../../lib/validation");
const Address = require("../addresses/addresses.model");

const serviceName = "Box";

class BoxService {
  static async bulkInsert(boxes, address, session) {
    const timestamp = new Date();
    // fetch information of address
    await Address.findOneAndUpdate(
      { _id: address._id },
      { $addToSet: { boxes: { $each: boxes.map((box) => box._id) } } }
    );
    return await save2db(boxes, {
      timestamp,
      serviceName,
      session,
    })
      .then(function (result) {
        if (result.error) {
          throw stdError(500, result.error, serviceName, serviceName);
        } else {
          return result;
        }
      })
      .catch(function (err) {
        console.error(err);
        throw stdError(500, err, serviceName, serviceName);
      });
  }

  static async getBoxById(args) {
    // check if box exists and is active
    let obj = {};
    return checkExistsById(BoxModel, args.id)
      .then(function (result) {
        if (result.error) {
          obj.error = result.error;
          return obj;
        }
        if (!result.doc.isActive.status) {
          throw stdError(404, "No Active Box Found", serviceName, serviceName);
        } else {
          return BoxUtils.convertToBox(result.doc);
        }
      })
      .catch(function (err) {
        throw stdError(
          500,
          "Unable to find box by Bifrost Id",
          serviceName,
          serviceName
        );
      });
  }

  static async deleteBoxes(boxes, address) {
    await Address(
      { address: address },
      { $pullAll: { boxes: boxes.map((box) => box._id) } }
    );
    await BoxModel.deleteMany({ _id: boxes.map((box) => box._id) });
  }
}

module.exports = BoxService;
