const BoxReader = require("../../lib/boxes/boxReader");
const BoxUtils = require("../../lib/boxes/boxUtils");
const { asyncFlatMap } = require("../../util/extensions");

class TransferTransaction {
    constructor(from, newBoxes, attestation, fee, timestamp, data, minting) {
        this.from = from;
        this.newBoxes = newBoxes;
        this.attestation = attestation;
        this.fee = fee;
        this.timestamp = timestamp;
        this.data = data;
        this.minting = minting;
        // currently Bifrost deletes all of the input boxes. This can be changed in the future to the customer's preference for box management.
        this.boxesToRemove = from;
    }

    static async getSenderBoxesForRawTransaction(addresses, returnBoxes, assetCode, bramblHelper) {
        let obj = {};
        // Lookup boxes for the given sender addresses
        return asyncFlatMap(addresses, (a) => {
            return BoxReader.getTokenBoxes(a, bramblHelper).then(function (result) {
                const errors = [];
                if (result) {
                    result.forEach((box) => {
                        if (box.error) {
                            errors.push(box.error);
                        }
                    });
                    if (errors.length > 0) {
                        obj.error = "Boxes for given address not found in DB.";
                        return obj;
                    }
                    if (result.length < 1) {
                        obj.error = "No boxes found to fund transactions";
                        return obj;
                    }
                    return result.filter((value) => {
                        // implement grouping
                        // always get polys since this is how fees are paid
                        return (
                            value.typeString === "PolyBox" ||
                            (value.typeString === "ArbitBox" && returnBoxes === "ArbitBox") ||
                            (value.typeString === "AssetBox" &&
                                returnBoxes === "Assets" &&
                                assetCode === value.value.assetCode)
                        );
                    });
                } else if (result.error) {
                    return result;
                } else {
                    return [];
                }
            });
        });
    }

    static async getSenderBoxesAndCheckPolyBalance(senders, fee, txType, bramblHelper, assetCode) {
        let obj = {};
        // Lookup boxes for the given senders
        const senderBoxes = await TransferTransaction.getSenderBoxesForRawTransaction(
            senders,
            txType,
            assetCode,
            bramblHelper
        ).then(function (result) {
            if (result.error) {
                obj.error = result.error;
                return obj;
            } else {
                return result;
            }
        });

        const errors = [];

        senderBoxes.map((box) => {
            if (box.error) errors.push(box.error);
        });

        // compute poly balance since it is used often
        // make sure there are no errors
        if (errors.length < 1) {
            const polyBalance = BoxUtils.calculatePolyBalance(senderBoxes);

            // ensure there are enough polys to pay the fee
            if (polyBalance < fee) {
                obj.error = "Insufficient funds to pay transaction fee";
            }
            return { senderBoxes: senderBoxes, polyBalance: polyBalance };
        } else {
            obj.error = errors;
            return obj;
        }
    }
}

TransferTransaction.prototype.equals = function (o) {
    return (
        this.from === o.from &&
        this.to === o.to &&
        this.attestation === o.attestation &&
        this.fee === o.fee &&
        this.data === o.data &&
        this.minting === o.minting
    );
};

module.exports = TransferTransaction;
