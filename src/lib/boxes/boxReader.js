const BoxService = require("../../modules/v1/state/box.service");
const AddressService = require("../../modules/v1/addresses/addresses.service");
const { asyncFlatMap } = require("../../util/extensions");

class BoxReader {
  static async getTokenBoxes(key, bramblHelper) {
    let self = this;
    let obj = {};
    return AddressService.getAddressByAddress({ address: key })
      .then(function (result) {
        // if we have already stored the state for the address in the DB
        return asyncFlatMap(result.boxes, (box) => {
          return self.getBox(box).then(function (result) {
            if (result.error) {
              obj.error = result.error;
              return obj;
            } else {
              return result;
            }
          });
        });
      })
      .catch(function (err) {
        console.error(err);
        // fall back to getting the token boxes from the JSON-RPC
        if (bramblHelper.brambljs) {
          return bramblHelper.getBoxesWithBrambl([key]);
        } else {
          return bramblHelper.getBoxesWithRequests([key]);
        }
      });
  }

  static async getBox(id) {
    // need to have the box serializer to make it match up with the JSON-RPC output
    let obj = {};
    return await BoxService.getBoxById({ id: id }).catch(function (err) {
      console.error(err);
      obj.error = err.message;
      return obj;
    });
  }
}

module.exports = BoxReader;
