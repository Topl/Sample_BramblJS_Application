const UserModel = require(`../user/user.model`)
const Address = require("./addresses.model");
const AddressesDao = require("./addressesDao.js");
const UsersService = require("../user/users.service");
const ObjectId = require('bson'); 
const mongoose = require('mongoose');
var BigNumber = require('bignumber');//handles topl poly balances

const stdErr = require('../../../core/standardError');
const BramblHelper = require("../../../lib/bramblHelper");
const save2db = require('../../../lib/saveToDatabase');
const findAndUpdate = require('../../../lib/findOneAndUpdate');
const deleteFromDb = require(`../../../lib/deleteFromDb`);
const {checkExists, checkExistsById} = require('../../../lib/validation');
const paginateAddresses = require(`../../../lib/paginateAddresses`)

const serviceName = 'Address'

class AddressesService {

    getTest() {
        return "Topl Sample API"
    }

    static async create(args) {
        const session = await mongoose.startSession();
        try {
            const timestamp = new Date();
            const userArgs = {
                userEmail: args.userEmail,
                requestedEmail: args.userEmail
            }

            // fetch information of user
            let fetchedUser = await UserModel.findOne({"email": args.userEmail});

            // create address
            const brambl = new BramblHelper(args.password, args.network);

            const address = await brambl.createAddress();

            let addressDoc = {
                name: args.name,
                user_id: args.userEmail,
                address: address.address,
                keyfile: address.keyfile,
                network: args.network
            };

            addressDoc.isActive = {
                status: true,
                asOf: timestamp,
            }
            let newAddress = new Address(addressDoc)

            // Save Address and User in transaction
            fetchedUser.addresses.push(newAddress._id);
            await save2db([fetchedUser, newAddress], {timestamp, serviceName, session});
            return newAddress;
        } catch (err) {
            throw err;
        } finally {
            session.endSession();
        }
    };

    static async updateAddress(args) {
        const session = await mongoose.startSession();
        try {
            const timestamp = new Date();
            // check if the address exists
            const [fetchedAddress, hasAdminAccess] = await Promise.all([
                checkExistsById(Address, args.addressId, {serviceName}),
                UsersService.checkAdmin(args.user_id),
                ]   
            )

            if (!fetchedAddress.isActive.status) {
                throw stdErr(404, "No Active Address", serviceName, serviceName);
            }

            // access control
            if (!hasAdminAccess && !(fetchedAddress.user_id === args.user_id)) {
                throw stdErr(403, "Not Authorized", serviceName, serviceName)
            }
            
            // update fields
            if (args.name) {
                fetchedAddress.name = args.name;
            }

            // save 
            await save2db(fetchedAddress, {timestamp, serviceName, session});
            return fetchedAddress;
        } catch (err) {
            throw err;
        } finally {
            session.endSession();
        }
    };

    static async deleteAddress(addressId, user) {
        try {
            if (!(await UsersService.checkAdmin(email))) {
                console.error(`Deletion unsuccessful`)
                return {error: `Deletion unsuccessful`}
            }
            return deleteFromDb(Address, {_id: addressId}, {serviceName: serviceName})
        } catch {
            console.error(`Error occurred while deleting user., ${e}`)
            return {error:e}
        }
    } 

    static async getAddresses(args) {
        try {
            const offset = args.page == 0 ? 0 : args.page * args.limit;
            const addresses = await Address.find().skip(offset).limit(args.limit)
            return addresses;
        } catch (err) {
            throw err;
        }
    } 
    
    static async getAddressesByUser(users) {
        try {
            const [fetchedUser, projects] = await Promise.all([
                checkExists(UserModel, args.user_id, {serviceName} ),
                paginateAddresses(args.user_id, args.page. args.limit),
            ]);

            if (!fetchedUser.isActive.status) {
                throw stdErr(404, "No Active User Found", serviceName, serviceName);
            }
            return projects
        } catch (err) {
            throw err;
        }
    }

    static async getAddressById(args) {
        const session = await mongoose.startSession();
        try {
            // check if address exists and is active

            const fetchedAddress = await checkExistsById(Address, args.addressId, {serviceName} ) 

            if (!fetchedAddress.isActive.status) {
                throw stdErr(404, "No Active Project", serviceName, serviceName);
            }

            return fetchedAddress;

        } catch (err) {
            throw err
        } finally {
            session.endSession
        }
    }

    static async searchAddresses(page, filters) {
        const ADDRESSES_PER_PAGE = 20
        const {addressesList, totalNumAddresses} = await AddressesDAO.getAddresses({
            filters,
            page,
            ADDRESSES_PER_PAGE
        })
        let response = {
            addresses: addressesList,
            page: page,
            filters,
            entries_per_page: ADDRESSES_PER_PAGE,
            totalResults: totalNumAddresses
        }
        return response
    }

    static async facetedSearch(page, filters) {
        const ADDRESSES_PER_PAGE = 20
        const facetedSearchResult = await AddressesDAO.facetedSearch(
            {
                filters,
                page,
                ADDRESSES_PER_PAGE
            }
        )
        return facetedSearchResult
    }

    static async getConfig() {
        const {poolSize, wtimeout, authInfo} = await AddressesDAO.getConfiguration()
        return {
            pool_size: poolSize,
            wtimeout,
            ...authInfo
        }
    }
 

}

module.exports = AddressesService