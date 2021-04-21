const stdRoute = require(`../../../core/standardRoute`)

const brambl =  require('../../../lib/bramblHelper')
const AddressesService = require('./addresses.service')
const AddressesDAO = require( "./addressesDAO")
const User = require ("../user/users.controller")
const ObjectId = require('bson');

let brambljs

class AddressesController{

    static getTest(req, res) {
        res.send("Topl Sample API")
    }

    static async create(req, res, next){
       const handler = AddressesService.create
       const network = req.body.network
       const password = req.body.password
       const name = req.body.name
       const userEmail = req.body.user_id
       const args = {
        network: network,
        password: password,
        name: name,
        userEmail: userEmail
    }
       const responseMsg = {
           success: "Address Created!"
       }
       stdRoute(req, res, handler, args, responseMsg)
    }

    static async apiUpdateAddress(req, res, next) {

            const name = req.body.name
            const handler = AddressesService.updateAddress
            const args = {
                name: name,
                addressId: req.params._id
            }
            const responseMsg = {
                success: 'Address Updated!'
            }
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
                success: 'Address Deleted!'
            };
            stdRoute(req, res, handler, args, responseMsg);
    }

    static async apiGetAddresses(req, res) {
        const handler = AddressesService.getAddresses
        const args = {
            user_id: req.body.user_id,
            page: parseInt(req.query.page) || 0,
            limit: parseInt(req.query.limit) || 20,
        };
        const responseMsg = {
            success: "Addresses retrieved!",
        }
        stdRoute(req, res, handler, args, responseMsg)
    }

    static async apiGetAddressesByUser(req, res) {
        let users = req.query.users
        const handler = AddressesService.getAddressesByUser
        const args = {
            user_id: req.params.email,
            page: parseInt(req.query.page) || 0,
            limit: parseInt(req.query.limit) || 20,
        };
        const responseMsg = {
            success: "Successfully retrieved Addresses!"
        }
        stdRoute(req, res, handler, args, responseMsg)
    }

    static async apiGetAddressById(req, res) {
            let id = req.params.id || {}
            const handler = AddressesService.getAddressById
            const args = {
                addressId: id
            }
            const responseMsg = {
                success: "Successfully retrieved Address!"
            }
            stdRoute(req, res, handler, args, responseMsg)
    }

    static async apiSearchAddresses(req, res) {
        const ADDRESSES_PER_PAGE = 20
        let page
        try {
            page = req.query.page ? parseInt(req.query.page, 10) : 0
        } catch (e) {
            console.error(`Got bad value for page:, ${e}`)
            page = 0
        }
        let searchType
        try {
            searchType = Object.keys(req.query)[0]
        } catch (e) {
            console.error(`No search keys specified: ${e}`)
        }

        let filters = {}

        switch(searchType) {
            case "users" :
                if (req.query.users !== "") {
                    filters.users = req.query.users
                }
                break
            case "text" :
                if (req.query.text !== "") {
                    filters.text = req.query.text
                }
                break
            default:
                //nothing to do
        }
        handler = AddressesService.searchAddresses
        args = {
            page,
            filters
        }
        responseMsg = {
            success: "Addresses Search Successful!"
        }
        stdRoute(req, res, handler, args, responseMsg)
    }

    static async apiFacetedSearch(req, res, next) {
        const ADDRESSES_PER_PAGE = 20

        let page
        try {
            page = req.query.page ? parseInt(req.query.page, 10) : 0
        } catch (e) {
            console.error(`Got bad value for page, defaulting to 0: ${e}`)
            page = 0
        }

        let filters = {}
        filters = req.query.users !== ""
            ? {users: new RegExp(req.query.users, "i")}
            : {users: "Chris Georgen"}
        
        const handler = AddressesService.facetedSearch
        const args = {page, filters}
        const responseMsg = {
            success: "Faceted Search Successful!"
        }

        stdRoute(req, res, handler, args, responseMsg)

    }
    
    static getConfig(req, res) {
        const handler = AddressesService.getConfiguration
        const args = {}
        const responseMsg = {
            success: "Configuration retrieved! "
        }
        stdRoute(req, res, handler, args, responseMsg)
    }

}

module.exports = AddressesController