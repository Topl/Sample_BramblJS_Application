const BoxService = require("./box.service");
const AddressModel = require("../addresses/addresses.model");
const BoxModel = require("./box.model");
const BoxUtils = require("../../../lib/boxes/boxUtils");
const { checkExists, findAll } = require("../../../lib/validation");
const { waitForMongooseConnection } = require("../../../lib/db/mongodb");
const stdError = require("../../../core/standardError");
const mongoose = require("mongoose");

const serviceName = "boxHelper";

class BoxHelper {
    static async updateBoxes(boxes, address) {
        let obj = {};
        await waitForMongooseConnection();
        const session = await mongoose.startSession();
        try {
            // fetch information for given address
            let fetchedBoxes = await checkExists(AddressModel, address, "address")
                .then(function (result) {
                    if (result.error) {
                        obj.error = result.error;
                        return obj;
                    }
                    obj.address = result.doc;
                    return findAll(BoxModel, result.doc.boxes, "_id");
                })
                .then(function (result) {
                    if (result.error) {
                        obj.error = result.error;
                        return obj;
                    } else {
                        return result;
                    }
                });

            // calculate the boxes to remove and the boxes to add
            const boxesToAdd = boxes.filter((box) => !BoxUtils.doesBoxArrayContainNonce(fetchedBoxes.doc, box.nonce));

            const boxesToRemove = fetchedBoxes.doc.filter(
                (box) => !BoxUtils.doesBoxArrayContainNonce(boxes, box.nonce) && box.isActive.status
            );

            const timestamp = new Date();
            const bulkBoxUpdateResult = await BoxService.bulkInsert(
                boxesToAdd.map((box) => BoxUtils.mapPolyBoxToModel(box, address, timestamp)),
                obj.address,
                session
            );
            for (const box of boxesToRemove) {
                await BoxService.deleteBoxByNonce(box.nonce, session).catch(function (err) {
                    console.error(err);
                    obj.error = err.message;
                });
            }
            return bulkBoxUpdateResult;
        } catch (error) {
            console.error(error);
            throw stdError(500, "Error updating boxes", error, serviceName);
        } finally {
            session.endSession();
        }
    }
}

module.exports = BoxHelper;
