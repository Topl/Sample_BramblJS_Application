const Address = require("./addresses.model");
const AddressesDao = require("./addressesDao.js");
const addressesDAO = new AddressesDao();
const UsersService = require("../user/users.service");
const ObjectId = require('bson'); 
const mongoose = require('mongoose');
const brambl = require('../../../lib/brambl.js');
var BigNumber = require('bignumber.js');//handles topl poly balances

const stdErr = require('../../../core/standardError');
const bramblHelper = require("../../../lib/bramblHelper");
const save2db = require('../../../lib/saveToDatabase');
const findAndUpdate = require('../../../lib/findOneAndUpdate');
const deleteFromDb = require(`../../../lib/deleteFromDb`);
const { default: AddressesDAO } = require("./addressesDao.js");

const serviceName = 'Address'

AddressesService  = {

    getTest: function() {
        return "Topl Sample API"
    },

    create: async function() {
        return brambl.createAddress()
    },

    postAddress: async function(keyfileId, title, trustRating, address, user) {
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
    },

    updateAddress: async function(title, trustRating, addressId) {
        const polyBalance = await bramblHelper.getBalance(address);
        const addressUpdate = {
            $set: {title: title},
            $set: {trustRating: trustRating},
            $set: {polyBalance: polyBalance}
        }

        return await findAndUpdate(Address, addressUpdate, addressId, {serviceName: serviceName})
    },

    deleteAddress: async function(addressId, user) {
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
    }, 

    getAddresses: async function() {
        const {addressesList, totalNumAddresses} = await addressesDAO.getAddresses()
        let response = {
            addresses: addressesList,
            total_results: totalNumAddresses
        }
        return response
    } 
    ,

    getAddressesByUsers: async function(users) {
        let usersList = Array.isArray(users) ? users : Array(users)
        let addressesList = await addressesDAO.getAddresses({filters: {
            "users": usersList
        }})
        let response = {
            addresses: addressesList,
        }
        return response
    },

    getAddressById: async function(id) {
        try {
            let address = await addressesDAO.getAddressById(id)
            if (!address) {
                return {error: "Not found"}
            }
            let updated_type = address.lastUpdatedDate instanceof Date ? "Date" : "other"
            return {address, updated_type}
        } catch (e) {
            console.log(`api, ${e}`)
            return {error: e}
        }
    },

    searchAddresses: async function(page, filters) {
        const ADDRESSES_PER_PAGE = 20
        const {addressesList, totalNumAddresses} = await addressesDAO.getAddresses({
            filters,
            page,
            ADDRESSES_PER_PAGE
        })
        let response = {
            addresses: addressesList,
            page: page,
            filters,
            entries_per_page = ADDRESSES_PER_PAGE,
            totalResults: totalNumAddresses
        }
        return response
    },

    facetedSearch: async function(page, filters) {
        const ADDRESSES_PER_PAGE = 20
        const facetedSearchResult = await addressesDAO.facetedSearch(
            {
                filters,
                page,
                ADDRESSES_PER_PAGE
            }
        )
        return facetedSearchResult
    },

    getConfig: async function() {
        const {poolSize, wtimeout, authInfo} = await addressesDAO.getConfiguration()
        return {
            pool_size = poolSize,
            wtimeout,
            ...authInfo
        }
    }
 

}

module.exports = AddressesService