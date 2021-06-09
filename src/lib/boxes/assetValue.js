const { StringOps } = require("../../util/extensions");
const stdError = require("../../core/standardError");
const { MAX_METADATA_LENGTH } = require("../../util/constants");

class AssetValue {
    constructor(quantity, assetCode, securityRoot, metadata) {
        this.assetCode = assetCode;
        this.quantity = quantity;
        this.securityRoot = securityRoot;
        this.metadata = metadata;
        if (metadata) {
            if (!StringOps.getValidLatin1Bytes(metadata)) {
                throw stdError(400, "String is not a valid Latin-1", "assetValueConstructor", "assetValueConstructor");
            } else if (metadata.length > MAX_METADATA_LENGTH) {
                throw stdError(
                    400,
                    "Metadata string must be less than 128 Latin-1 characters",
                    "assetValueConstructor",
                    "assetValueConstructor"
                );
            }
        }
    }
}

module.exports = AssetValue;
