const UserModel = require(`../user/user.model`);
const Address = require("./addresses.model");
const UsersService = require("../user/users.service");
const mongoose = require("mongoose");
const stdError = require("../../../core/standardError");

const stdErr = require("../../../core/standardError");
const BramblHelper = require("../../../lib/bramblHelper");
const save2db = require("../../../lib/db/saveToDatabase");
const { waitForMongooseConnection } = require("../../../lib/db/mongodb");
const { checkExists, checkExistsById } = require("../../../lib/validation");
const paginateAddresses = require(`../../../lib/paginateAddresses`);
const BoxHelper = require(`../state/boxHelper`);

const serviceName = "Address";

class AddressesService {
  getTest() {
    return "Topl Sample API";
  }

  static async create(args) {
    await waitForMongooseConnection();
    const session = await mongoose.startSession();
    try {
      const timestamp = new Date();

      // fetch information of user
      let fetchedUser = await checkExists(UserModel, args.userEmail, "email");
      const [balances, keyfile, address] =
        await AddressesService.getBalancesForAddress(
          args.address,
          args.network,
          args.password
        );

      let addressDoc = {
        name: args.name,
        user_id: args.userEmail,
        address: address,
        keyfile: keyfile ? keyfile : args.keyfile,
        network: args.network,
        polyBalance: balances.polyBalance,
      };

      addressDoc.isActive = {
        status: true,
        asOf: timestamp,
      };
      let newAddress = new Address(addressDoc);

      // Save Address and User in transaction
      if (fetchedUser.doc) {
        fetchedUser.doc.addresses.push(newAddress._id);
        await save2db([fetchedUser.doc, newAddress], {
          timestamp,
          serviceName,
          session,
        }).then(function (result) {
          if (result.error) {
            throw stdError(500, result.error, serviceName, serviceName);
          } else {
            // iterate through boxes and either add or update them in the DB
            if (balances.boxes) {
              return BoxHelper.updateBoxes(balances.boxes, address).then(
                function (result) {
                  if (result.error) {
                    throw stdErr(
                      500,
                      "Unable to update application view",
                      result.error,
                      serviceName
                    );
                  } else {
                    return result;
                  }
                }
              );
            }
            return result;
          }
        });
      } else {
        await save2db(newAddress, { timestamp, serviceName, session })
          .then(function (result) {
            if (result.error) {
              throw stdError(500, result.error, serviceName, serviceName);
            } else {
              // iterate through boxes and either add or update them in the DB
              if (balances.boxes) {
                return BoxHelper.updateBoxes(balances.boxes, args.address).then(
                  function (result) {
                    if (result.error) {
                      throw stdErr(
                        500,
                        "Unable to update application view",
                        result.error,
                        serviceName
                      );
                    } else {
                      return result;
                    }
                  }
                );
              }
              return result;
            }
          })
          .catch(function (err) {
            console.error(err);
            throw stdError(
              400,
              "Invalid Payload: Unable to update address in DB",
              serviceName,
              serviceName
            );
          });
      }
      return newAddress.toJSON();
    } catch (err) {
      if (err.name === "MongoError" && err.code === 11000) {
        throw stdErr(
          422,
          "The provided address is already in use",
          serviceName,
          serviceName
        );
      } else {
        throw err;
      }
    } finally {
      session.endSession();
    }
  }

  static async updateBoxesHelper(boxes, address) {
    return BoxHelper.updateBoxes(boxes, address).then(function (result) {
      if (result.error) {
        throw stdErr(
          500,
          "Unable to update application view",
          result.error,
          serviceName
        );
      } else {
        return result;
      }
    });
  }

  static async updateAddressByAddress(args) {
    // check if the address already exists
    let obj = {};
    const self = this;
    return await checkExists(Address, args.addressId, "address").then(function (
      result
    ) {
      if (result.error) {
        throw stdErr(
          500,
          "Unable to update address by address",
          serviceName,
          serviceName
        );
      }
      return self.updateAddress(args, result.doc).catch(function (err) {
        console.error(err);
        obj.err = err.message;
        return obj;
      });
    });
  }

  static async updateAddressById(args) {
    // check if the address exists in the db
    const fetchedAddress = await checkExistsById(Address, args.addressId)
      .then(function (result) {
        if (!result.doc.isActive.status) {
          throw stdErr(
            404,
            "No Active Address Found",
            serviceName,
            serviceName
          );
        }
        return result.doc;
      })
      // eslint-disable-next-line no-unused-vars
      .catch(function (err) {
        console.error(err);
        throw stdErr(
          500,
          "Unable to update address by ID",
          serviceName,
          serviceName
        );
      });
    return AddressesService.updateAddress(args, fetchedAddress);
  }

  static async updateAddress(args, fetchedAddress) {
    await waitForMongooseConnection();
    const session = await mongoose.startSession();
    try {
      // eslint-disable-next-line no-unused-vars
      let balances;
      let keyfile;
      if (args.newBoxes) {
        balances = {
          boxes: args.newBoxes,
          polyBalance: args.polyBalance,
        };
      } else {
        [balances, keyfile] = await AddressesService.getBalancesForAddress(
          args.addressId,
          args.network,
          args.password
        ).catch(function (err) {
          console.error(err);
          return [false, false];
        });
        if (!args.polyBalance) {
          args.polyBalance = balances.polyBalance;
        }
      }

      // retrieve boxes. Only update the new boxes in the DB and for the address
      if (balances) {
        await BoxHelper.updateBoxes(balances.boxes, fetchedAddress.address);
      }

      const timestamp = new Date();
      // update fields
      if (args.name) {
        fetchedAddress.name = args.name;
      }

      if (args.polyBalance) {
        fetchedAddress.polyBalance = args.polyBalance;
      }

      // save
      await save2db(fetchedAddress, { timestamp, serviceName, session }).then(
        function (result) {
          if (result.error) {
            throw stdError(500, result.error, serviceName, serviceName);
          }
          return checkExists(Address, fetchedAddress.address, "address").then(
            function (result) {
              if (result.error) {
                throw stdError(500, result.error, serviceName, serviceName);
              }
              return result.doc;
            }
          );
        }
      );
      return fetchedAddress.toJSON();
    } catch (err) {
      throw err;
    } finally {
      session.endSession();
    }
  }

  static async deleteAddress(args) {
    await waitForMongooseConnection();
    const session = await mongoose.startSession();
    try {
      const timestamp = new Date();
      const fetchedAddress = await checkExistsById(Address, args.addressId);

      if (!fetchedAddress.doc.isActive.status) {
        throw stdErr(404, "No Active Address", serviceName, serviceName);
      }

      // fetch user
      const user_id = fetchedAddress.doc.user_id.toString();
      let [hasAdminAccess, fetchedUser] = await Promise.all([
        UsersService.checkAdmin(user_id),
        UserModel.findOne({ email: user_id }),
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
      fetchedAddress.doc.isActive.status = false;
      fetchedAddress.doc.markModified("isActive.status");
      fetchedAddress.doc.isActive.asOf = timestamp;
      fetchedAddress.doc.markModified("isActive.asOf");
      const addressIndex = fetchedUser.addresses.findIndex((elem) => {
        elem.equals(mongoose.Types.ObjectId(args.addressId));
      });
      fetchedUser.addresses.splice(addressIndex, 1);
      await save2db([fetchedUser, fetchedAddress.doc], {
        timestamp,
        serviceName,
        session,
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
      const addresses = await Address.find().skip(offset).limit(args.limit);
      return addresses.map((address) => address.toJSON());
    } catch (err) {
      throw err;
    }
  }

  static async getAddressesByUser(args) {
    try {
      const [fetchedUser, addresses] = await Promise.all([
        checkExists(UserModel, args.user_id, "email"),
        paginateAddresses(args.user_id, args.page, args.limit),
      ]);

      if (!fetchedUser.doc.isActive.status) {
        throw stdErr(404, "No Active User Found", serviceName, serviceName);
      }
      return addresses.map((address) => address.toJSON());
    } catch (err) {
      throw err;
    }
  }

  static async getAddressByAddress(args) {
    // check if address exists and is active
    return await checkExists(Address, args.address, "address").then(function (
      result
    ) {
      if (result.error) {
        throw stdErr(404, "Unable to find address", serviceName, serviceName);
      }

      if (!result.doc.isActive.status) {
        throw stdErr(404, "No Active Address", serviceName, serviceName);
      }
      if (args.httpResponse) {
        return result.doc.toJSON();
      }
      return result.doc;
    });
  }

  static async getAddressById(args) {
    try {
      // check if address exists and is active

      const fetchedAddress = await checkExistsById(Address, args.addressId);

      if (!fetchedAddress.doc.isActive.status) {
        throw stdErr(404, "No Active Address", serviceName, serviceName);
      }

      return fetchedAddress.doc.toJSON();
    } catch (err) {
      throw err;
    }
  }

  static async getBalancesForAddress(address, network, password) {
    let balances;
    let keyfile;
    let brambl;
    let bramblHelperParams;
    let obj = {};
    if (address) {
      bramblHelperParams = {
        readOnly: true,
        network: network,
      };
      brambl = new BramblHelper(bramblHelperParams);
      //retrieve the polyBalance for the address that has been imported
      balances = await brambl.getBalanceWithRequests(address);
    } else {
      // create address
      bramblHelperParams = {
        readOnly: false,
        network: network,
        password: password,
      };
      brambl = new BramblHelper(bramblHelperParams);
      const generatedAddress = await brambl
        .createAddress()
        .catch(function (err) {
          console.error(err);
          obj.error = err.message;
          return obj;
        });
      if (!generatedAddress.error) {
        address = generatedAddress.address;
        keyfile = generatedAddress.keyfile;
        balances = {
          polyBalance: 0,
        };
      } else {
        throw stdErr(500, generatedAddress.error, serviceName, serviceName);
      }
      // retrieve and update boxes in db
    }

    if (!balances) {
      throw stdErr(
        500,
        "Unable to retrieve balance for address from network",
        serviceName,
        serviceName
      );
    } else if (balances.polyBalance < 0) {
      throw stdErr(
        500,
        "polyBalance for address must be greater than 0.",
        serviceName,
        serviceName
      );
    }
    return [balances, keyfile, address];
  }
}

module.exports = AddressesService;
