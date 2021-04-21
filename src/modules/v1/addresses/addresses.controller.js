const stdRoute = require(`../../../core/standardRoute`);
const AddressesService = require("./addresses.service");

class AddressesController {
  static async create(req, res) {
    const handler = AddressesService.create;
    const network = req.body.network;
    const password = req.body.password;
    const name = req.body.name;
    const userEmail = req.body.user_id;
    const args = {
      network: network,
      password: password,
      name: name,
      userEmail: userEmail
    };
    const responseMsg = {
      success: "Address Created!"
    };
    stdRoute(req, res, handler, args, responseMsg);
  }

  static async apiUpdateAddress(req, res) {
    const name = req.body.name;
    const handler = AddressesService.updateAddress;
    const args = {
      name: name,
      addressId: req.params._id
    };
    const responseMsg = {
      success: "Address Updated!"
    };
    stdRoute(req, res, handler, args, responseMsg);
  }

  static async apiDeleteAddress(req, res) {
    const addressId = req.body.addressId;
    const userEmail = req.body.user_id;

    const handler = AddressesService.deleteAddress;
    const args = {
      addressId: addressId,
      user_id: userEmail
    };

    const responseMsg = {
      success: "Address Deleted!"
    };
    stdRoute(req, res, handler, args, responseMsg);
  }

  static async apiGetAddresses(req, res) {
    const handler = AddressesService.getAddresses;
    const args = {
      user_id: req.body.user_id,
      page: parseInt(req.query.page) || 0,
      limit: parseInt(req.query.limit) || 20
    };
    const responseMsg = {
      success: "Addresses retrieved!"
    };
    stdRoute(req, res, handler, args, responseMsg);
  }

  static async apiGetAddressesByUser(req, res) {
    const handler = AddressesService.getAddressesByUser;
    const args = {
      user_id: req.params.email,
      page: parseInt(req.query.page) || 0,
      limit: parseInt(req.query.limit) || 20
    };
    const responseMsg = {
      success: "Successfully retrieved Addresses!"
    };
    stdRoute(req, res, handler, args, responseMsg);
  }

  static async apiGetAddressById(req, res) {
    let id = req.params.id || {};
    const handler = AddressesService.getAddressById;
    const args = {
      addressId: id
    };
    const responseMsg = {
      success: "Successfully retrieved Address!"
    };
    stdRoute(req, res, handler, args, responseMsg);
  }
}

module.exports = AddressesController;
