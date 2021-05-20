const BoxService = require("../../modules/v1/state/box.service");
const AddressService = require("../../modules/v1/addresses/addresses.service");
const { asyncFlatMap } = require("../../util/extensions");

class BoxReader {
  static async getTokenBoxes(key) {
    let self = this;
    let obj = {};
    return await AddressService.getAddressByAddress({ address: key })
      .then(function(result) {
        return self.getBox(result.address);
      })
      .catch(function(err) {
        console.error(err);
        obj.error = err.message;
        return obj;
      });
  }

  static async getBox(id) {
    // need to have the box serializer to make it match up with the JSON-RPC output
    let obj = {};
    return BoxService.getBoxById({ id: id }).catch(function(err) {
      console.error(err);
      obj.error = err.message;
      return obj;
    });
  }
}

module.exports = BoxReader;
