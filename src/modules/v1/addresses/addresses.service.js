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
const {checkExists} = require('../../../lib/validation');
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

    static async postAddress(keyfileId, title, trustRating, address, user) {
        const date = new Date()
        const polyBalance = await bramblHelper.getBalance(address);
        const addressData = new Address({
            address: address,
            title: title,
            lastUpdatedDate: date,
            polyBalance: polyBalance,
            user_id: user.email,
            trustRating: trustRating,
            keyfileId: keyfileId
            }
        )

        const addressResponse = await save2db(addressData, {serviceName: serviceName})

        return updatedAddress = this.getAddressById(
            addressResponse._id
        )
    }

    static async updateAddress(title, trustRating, addressId) {
        const polyBalance = await bramblHelper.getBalance(address);
        const addressUpdate = {
            $set: {title: title},
            $set: {trustRating: trustRating},
            $set: {polyBalance: polyBalance}
        }

        return await findAndUpdate(Address, addressUpdate, addressId, {serviceName: serviceName})
    }

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

    static async getAddressById(id) {
        try {
            let address = await AddressesDAO.getAddressById(id)
            if (!address) {
                return {error: "Not found"}
            }
            let updated_type = address.lastUpdatedDate instanceof Date ? "Date" : "other"
            return {address, updated_type}
        } catch (e) {
            console.log(`api, ${e}`)
            return {error: e}
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