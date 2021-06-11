const BramblJS = require("brambljs");

class RequestValidator {
    static validateAddresses(value, network) {
        try {
            if (!Array.isArray(value)) {
                return Promise.reject("Please enter a valid list of Addresses");
            }
            const result = BramblJS.utils.validateAddressesByNetwork(network, value);
            if (result.success) {
                return Promise.resolve();
            } else {
                return Promise.reject("Addresses invalid");
            }
        } catch (err) {
            return Promise.reject("Address must be base58 encoded");
        }
    }
}

module.exports = RequestValidator;
