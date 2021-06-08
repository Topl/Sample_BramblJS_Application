/* eslint-disable no-unused-vars */
const mongoose = require("mongoose");
const stdError = require("../../../core/standardError");
const BoxModel = require("./box.model");
const save2db = require("../../../lib/db/saveToDatabase");
const { checkExistsById, checkExists } = require("../../../lib/validation");
const Address = require("../addresses/addresses.model");

const serviceName = "Box";

class BoxService {
  static async saveToDb(args) {
    const session = await mongoose.startSession();
    try {
      // fetch information of address for box
      let fetchedAddress = await checkExists(
        Address,
        args.address,
        "address"
      ).then(function (result) {
        if (result.error) {
          throw stdError(
            500,
            "Unable to find corresponding address for box",
            serviceName,
            serviceName
          );
        } else {
          return result;
        }
      });

      const timestamp = new Date();
      // if box is not provided
      if (!args.box) {
        stdError(400, "No box provided to save", serviceName, serviceName);
      }

      let boxDoc = {
        address: args.address,
        nonce: args.nonce,
        bifrostId: args.bifrostId,
        evidence: args.evidence,
        boxType: args.boxType,
        value: args.value,
      };

      boxDoc.isActive = {
        status: true,
        asOf: timestamp,
      };
      let newBox = new BoxModel(boxDoc);

      // Save address and box in transaction
      if (fetchedAddress.doc) {
        fetchedAddress.doc.boxes.push(newBox._id);
        await save2db([fetchedAddress.doc, newBox], {
          timestamp,
          serviceName,
          session,
        }).then(function (result) {
          if (result.error) {
            throw stdError(500, result.error, serviceName, serviceName);
          } else {
            return result;
          }
        });
      } else {
        await save2db(newBox, { timestamp, serviceName, session })
          .then(function (result) {
            if (result.error) {
              throw stdError(500, result.error, serviceName, serviceName);
            } else {
              return result;
            }
          })
          .catch(function (err) {
            console.error(err);
            throw stdError(
              400,
              "Invalid Payload: Unable to update box in DB",
              serviceName,
              serviceName
            );
          });
      }
      return newBox;
    } catch (err) {
      if (err.name === "MongoError" && err.code === 11000) {
        throw stdError(
          422,
          "The provided box is already in use",
          serviceName,
          serviceName
        );
      } else {
        throw err;
      }
    } finally {
      session.endSession();
    }
  }

  static async bulkInsert(boxes, address) {
    const timestamp = new Date();
    const session = await mongoose.startSession();
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
          return result.doc;
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
