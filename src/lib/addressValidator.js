const BramblJS = require("brambljs");

class AddressValidator {
  static isAddress(address, network) {
    return BramblJS.utils.validateAddressesByNetwork(network, [address]);
  }
}

module.exports = AddressValidator;
