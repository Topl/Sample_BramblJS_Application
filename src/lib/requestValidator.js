const BramblJS = require("brambljs");

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

  static async validateNetwork(value) {
    // Check that the networks field is not empty, a string, and a valid network
    if (!BramblJS.utils.isValidNetwork(value)) {
      return Promise.reject("Please provide a valid network");
    }
    return Promise.resolve();
  }

  static async validateBody(body) {
    return new Promise((resolve, reject) => {
      if (typeof body === "object" && Object.keys(body).length != 0) {
        let obj = {};
        obj.propositionType = PROPOSITION_TYPES.find(proposition => {
          return proposition === body.propositionType;
        })
          ? body.propositionType
          : null;
        obj.sender = body.sender;
        const isSenderValid = RequestValidator.validateAddress(
          obj.sender,
          body.network
        );
        if (!isSenderValid) {
          obj.error = "Sender Address Invalid";
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
            } else {
              obj.recipients = body.recipients;
            }
          }
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
