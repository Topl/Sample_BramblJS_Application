/* eslint-disable no-unused-vars */
const stdError = require("../../../core/standardError");
const BoxModel = require("./box.model");
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
                    return result.doc;
                }
            })
            .catch(function (err) {
                throw stdError(500, "Unable to find box by Bifrost Id", serviceName, serviceName);
            });
    }

    static async deleteBoxByNonce(nonce, session) {
        let obj = {};
        try {
            const timestamp = new Date();
            return await checkExists(BoxModel, nonce, "nonce")
                .then(function (fetchedBox) {
                    if (fetchedBox.error) {
                        obj.error = fetchedBox.error;
                        return obj;
                    } else {
                        if (!fetchedBox.doc.isActive.status) {
                            throw stdError(404, "No Active Box", serviceName, serviceName);
                        }
                        // fetch address
                        const addressId = fetchedBox.doc.address.toString();
                        return checkExists(Address, addressId, "address")
                            .then(function (fetchedAddress) {
                                if (!fetchedAddress.doc) {
                                    throw stdError(404, "No Active Address for Box", serviceName, serviceName);
                                } else if (!fetchedAddress.doc.isActive.status) {
                                    throw stdError(404, "No Active Address for Box");
                                }

                                fetchedBox.doc.isActive.status = false;
                                fetchedBox.doc.markModified("isActive.status");
                                fetchedBox.doc.isActive.asOf = timestamp;
                                fetchedBox.doc.markModified("isActive.asOf");
                                Address.updateOne(
                                    { _id: fetchedAddress.doc._id },
                                    { $pullAll: { boxes: fetchedBox.doc._id } }
                                );
                                return save2db([fetchedAddress.doc, fetchedBox.doc], {
                                    timestamp,
                                    serviceName,
                                    session,
                                }).then(function (result) {
                                    if (result.error) {
                                        throw stdError(500, result.error, serviceName, serviceName);
                                    }
                                    return result;
                                });
                            })
                            .catch(function (err) {
                                console.error(err);
                                throw err;
                            });
                    }
                })
                .catch(function (err) {
                    console.error(err);
                    throw err;
                });
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            session.endSession();
        }
    }
}

module.exports = BoxService;
