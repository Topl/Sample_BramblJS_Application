const BramblJS = require("brambljs");
const { MAX_INTEGER, MAX_METADATA_LENGTH } = require("../util/constants");

const PROPOSITION_TYPES = ["PublicKeyCurve25519", "ThresholdCurve25519"];

class RequestValidator {
  static validateAddress(value, network) {
    try {
      if (!value || typeof value !== "string" || value === "") {
        return Promise.reject("Please enter a valid Address");
      }
      const result = BramblJS.utils.validateAddressesByNetwork(network, [
        value
      ]);
      if (result.success) {
        return Promise.resolve();
      } else {
        return Promise.reject("Address invalid");
      }
    } catch (err) {
      //console.log(err);
      return Promise.reject("Address must be base58 encoded");
    }
  }

  static validateAsset(value) {
    return value && BramblJS.utils.isValidAssetCode(value);
  }

  static async validateNetwork(value) {
    // Check that the networks field is not empty, a string, and a valid network
    if (!BramblJS.utils.isValidNetwork(value)) {
      return Promise.reject("Please provide a valid network");
    }
    return Promise.resolve();
  }

  static async validateBody(body, requestType) {
    return new Promise((resolve, reject) => {
      if (typeof body === "object" && Object.keys(body).length != 0) {
        let obj = {};
        obj.propositionType = PROPOSITION_TYPES.find(proposition => {
          return proposition === body.propositionType;
        })
          ? body.propositionType
          : null;
        obj.network = body.network;
        const isNetworkValid = RequestValidator.validateNetwork(obj.network);
        if (!isNetworkValid) {
          obj.error = "Network Invalid";
        }
        if (Array.isArray(body.senders)) {
          for (var i = 0; i < body.senders.length; i++) {
            if (body.senders[i] == null) {
              obj.error = "sender address is null or empty";
            } else if (
              !RequestValidator.validateAddress(
                body.senders[i][0],
                body.network
              )
            ) {
              obj.error = "invalid address for given network";
            }
          }
          obj.senders = body.senders;
        } else {
          obj.error = "sender is not a nested array of [String, String]";
        }

        if (Array.isArray(body.recipients)) {
          for (var i = 0; i < body.recipients.length; i++) {
            if (body.recipients[i][0] == null) {
              obj.error = "recipient address missing";
            } else if (
              !RequestValidator.validateAddress(
                body.recipients[i][0],
                body.network
              )
            ) {
              obj.error = "invalid address";
            } else if (
              body.recipients[i][1] < 0 ||
              body.recipients[i][1] > MAX_INTEGER
            ) {
              obj.error = "invalid quantity";
            }
          }
        } else if (requestType !== "burn") {
          obj.recipients = body.recipients;
        } else {
          obj.error = "recipients is not an array of [String, String]";
        }
        obj.changeAddress = body.changeAddress;
        const changeAddressValid = RequestValidator.validateAddress(
          body.changeAddress,
          body.network
        );
        if (!changeAddressValid) {
          obj.error = "Change Address Invalid";
        }
        obj.consolidationAddress = body.consolidationAddress;
        if (obj.consolidationAddress != null) {
          if (
            !RequestValidator.validateAddress(
              obj.consolidationAddress,
              body.network
            )
          ) {
            obj.error = "Consolidation Address Invalid";
          }
        }
        obj.assetCode = body.assetCode;
        if (obj.assetCode != null) {
          if (!RequestValidator.validateAsset(obj.assetCode)) {
            obj.error = "Asset Code Invalid";
          }
        }
        obj.metadata = body.metadata;
        if (obj.metadata != null) {
          if (obj.metadata > MAX_METADATA_LENGTH) {
            obj.error =
              "Attached data is greater than the maximum character length. Please include shorter data";
          }
        }
        if (obj.error) {
          reject(new Error(obj.error));
        } else {
          resolve(obj);
        }
      } else {
        reject(new Error("Missing or invalid request json object"));
      }
    });
  }
}

module.exports = RequestValidator;
