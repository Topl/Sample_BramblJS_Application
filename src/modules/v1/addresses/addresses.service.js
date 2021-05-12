const UserModel = require(`../user/user.model`);
const Address = require("./addresses.model");
const UsersService = require("../user/users.service");
const mongoose = require("mongoose");

const stdErr = require("../../../core/standardError");
const BramblHelper = require("../../../lib/bramblHelper");
const save2db = require("../../../lib/saveToDatabase");
const {
  checkExists,
  checkExistsById,
  checkExistsByAddress
} = require("../../../lib/validation");
const paginateAddresses = require(`../../../lib/paginateAddresses`);
const standardError = require("../../../core/standardError");

const serviceName = "Address";

class AddressesService {
  getTest() {
    return "Topl Sample API";
  }

  static async create(args) {
    const session = await mongoose.startSession();
    try {
      const timestamp = new Date();

      // fetch information of user
      let fetchedUser = await UserModel.findOne({ email: args.userEmail });
      let address;
      let keyfile;
      let brambl;
      // if address is not provided.
      if (!args.address) {
        // create address
        brambl = new BramblHelper(false, args.password, args.network);

        const generatedAddress = await brambl.createAddress();
        address = generatedAddress.address;
        keyfile = address.keyfile;
      } else {
        brambl = new BramblHelper(true, args.network);
        address = args.address;
      }

      //retrieve the polyBalance for the address that has been imported
      const balances = await brambl.getBalance(address);

      if (!balances) {
        stdErr(
          500,
          "Unable to retrieve balance for address from network",
          serviceName,
          serviceName
        );
      } else if (balances.polyBalance < 0) {
        stdErr(
          500,
          "polyBalance for address must be greater than 0.",
          serviceName,
          serviceName
        );
      }

      let addressDoc = {
        name: args.name,
        user_id: args.userEmail,
        address: address,
        keyfile: keyfile,
        network: args.network,
        polyBalance: balances.polyBalance
      };

      addressDoc.isActive = {
        status: true,
        asOf: timestamp
      };
      let newAddress = new Address(addressDoc);

      // Save Address and User in transaction
      if (fetchedUser) {
        fetchedUser.addresses.push(newAddress._id);
        await save2db([fetchedUser, newAddress], {
          timestamp,
          serviceName,
          session
        });
      } else {
        await save2db(newAddress, { timestamp, serviceName, session });
      }
      return newAddress;
    } catch (err) {
      throw err;
    } finally {
      session.endSession();
    }
  }

  static async updateAddressByAddress(args) {
    // check if the address already exists
    const self = this;
    return await checkExistsByAddress(Address, args.addressId).then(function(result) {
      if (result.error) {
        throw stdErr(
          500,
          "Unable to update address by address",
          serviceName,
          serviceName
        );
      }
      if (!result.isActive.status) {
        throw stdErr(404, "No Active Address", serviceName, serviceName);
      }
      return self.updateAddress(args, result).then(function(result) {
        return result;
      });
    });
  }

  static async updateAddressById(args) {
    // check if the address exists in the db
    const fetchedAddress = await checkExistsById(Address, args.addressId, {
      serviceName
    })
      .then(function(result) {
        if (!result.isActive.status) {
          throw stdErr(404, "No Active Address", serviceName, serviceName);
        }
      })
      // eslint-disable-next-line no-unused-vars
      .catch(function(err) {
        throw stdErr(
          500,
          "Unable to update address by ID",
          serviceName,
          serviceName
        );
      });
    return this.updateAddress(args, fetchedAddress);
  }

  static async updateAddress(args, fetchedAddress) {
    const session = await mongoose.startSession();
    try {
      const timestamp = new Date();
      // check if the address exists

      // update fields
      if (args.name) {
        fetchedAddress.name = args.name;
      }

      if (args.polyBalance) {
        fetchedAddress.polyBalance = args.polyBalance;
      }

      // save
      await save2db(fetchedAddress, { timestamp, serviceName, session });
      return fetchedAddress;
    } catch (err) {
      throw err;
    } finally {
      session.endSession();
    }
  }

  static async deleteAddress(args) {
    const session = await mongoose.startSession();
    try {
      const timestamp = new Date();
      const fetchedAddress = await checkExistsById(Address, args.addressId, {
        serviceName
      });

      if (!fetchedAddress.isActive.status) {
        throw stdErr(404, "No Active Address", serviceName, serviceName);
      }

      // fetch user
      const user_id = fetchedAddress.user_id.toString();
      let [hasAdminAccess, fetchedUser] = await Promise.all([
        UsersService.checkAdmin(user_id),
        UserModel.findOne({ email: user_id })
      ]);

      if (!fetchedUser) {
        throw stdErr(404, "No Active User", serviceName, serviceName);
      } else if (!fetchedUser.isActive.status) {
        throw stdErr(404, "No Active User", serviceName, serviceName);
      }

      // access control
      if (!hasAdminAccess && !(user_id === args.user_id)) {
        throw stdErr(403, "Not Authorized", serviceName, serviceName);
      }

      // business logic
      fetchedAddress.isActive.status = false;
      fetchedAddress.markModified("isActive.status");
      fetchedAddress.isActive.asOf = timestamp;
      fetchedAddress.markModified("isActive.asOf");
      const addressIndex = fetchedUser.addresses.findIndex(elem => {
        elem.equals(mongoose.Types.ObjectId(args.addressId));
      });
      fetchedUser.addresses.splice(addressIndex, 1);
      await save2db([fetchedUser, fetchedAddress], {
        timestamp,
        serviceName,
        session
      });

      return {};
    } catch (err) {
      throw err;
    } finally {
      session.endSession();
    }
  }

  static async getAddresses(args) {
    try {
      const offset = args.page == 0 ? 0 : args.page * args.limit;
      const addresses = await Address.find()
        .skip(offset)
        .limit(args.limit);
      return addresses;
    } catch (err) {
      throw err;
    }
  }

  static async getAddressesByUser(args) {
    try {
      const [fetchedUser, projects] = await Promise.all([
        checkExists(UserModel, args.user_id, { serviceName }),
        paginateAddresses(args.user_id, args.page, args.limit)
      ]);

      if (!fetchedUser.isActive.status) {
        throw stdErr(404, "No Active User Found", serviceName, serviceName);
      }
      return projects;
    } catch (err) {
      throw err;
    }
  }

  static async getAddressById(args) {
    const session = await mongoose.startSession();
    try {
      // check if address exists and is active

      const fetchedAddress = await checkExistsById(Address, args.addressId, {
        serviceName
      });

      if (!fetchedAddress.isActive.status) {
        throw stdErr(404, "No Active Address", serviceName, serviceName);
      }

      return fetchedAddress;
    } catch (err) {
      throw err;
    } finally {
      session.endSession;
    }
  }
}

module.exports = AddressesService;
