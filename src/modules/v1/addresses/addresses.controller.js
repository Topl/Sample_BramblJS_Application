const stdRoute = require(`../../../core/standardRoute`)

const brambl =  require('../../../lib/brambl.js')
const AddressesService = require('./addresses.service')
const addresssesService = new AddressesService()
const AddressesDAO = require( "../dao/addressesDAO.js")
const User = require ("./users.controller.js")
const ObjectId = require('bson');

let brambljs

AddressesController = {

    getTest: function(req, res) {
        res.send("Topl Sample API")
    },

    create: function(req, res, next){
       handler = addressesService.createAddress
       const args = {}
       const responseMsg = {
           success: "Address Created!"
       }
       stdRoute(req, res, handler, args, responseMsg)
    },

    apiPostAddress: async function(req, res) {
            const userJwt = req.get("Authorization").slice("Bearer ".length)
            const user = await User.decoded(userJwt)
            var {error} = user
            if (error) {
                res.status(401).json({error})
                return 
            }

            const keyfileId = req.body.keyfileId
            const title = req.body.title
            const trustRating = req.body.trustRating
            const address = req.body.address
            const handler = addressesService.postAddress
            const args = {
                keyfileId, 
                title,
                trustRating, 
                address,
                user
            }

            const responseMessage = {
                success: "success"
            }
            
            stdRoute(req, res, handler, args, responseMessage)

    },

    apiUpdateAddress: async function(req, res, next) {
            const userJwt = req.get("Authorization").slice("Bearer ".length)
            const user = await User.decoded(userJwt)
            var {error} = user
            if (error) {
                res.status(401).json({error})
                return
            }

            const addressId = req.body.addresss_id
            const title = req.body.title
            const trustRating = req.body.trustRating
            handler = addressesService.updateAddress
            const args = {
                title,
                trustRating,
                addressId
            }
            const responseMsg = {
                success: 'Addresses Updated!'
            }
            stdRoute(req, res, handler, args, responseMsg)
    } ,

    apiDeleteAddress(req, res) {
            const userJwt = req.get("Authorization").slice("Bearer ".length)
            const user = await User.decoded(userJwt)
            var {error} = user
            if (error) {
                res.status(401).json({error})
                return
            }

            const addressId = req.body.addressId
            const userEmail = user.userEmail

            handler = addressesService.deleteAddress
            args = {
                addressId
            }

            const responseMsg = {
                success: 'Address Deleted!'
            }
            stdRoute(req, res, handler, args, responseMsg)
    } ,

    apiGetAddresses: async function(req, res) {
        const ADDRESSES_PER_PAGE = 20
        handler = addressesService.getAddresses
        args = {}
        resonseMsg = {
            success: "Addresses retrieved!"
        }
        stdRoute(req, res, handler, args, responseMsg)
    },

    apiGetAddressesByUsers: async function(req, res) {
        let users = req.query.users
        handler = addressesService.getAddressesByUser
        args = {
            users
        }
        responseMsg = {
            success: "Successfully retrieved Addresses!"
        }
        stdRoute(req, res, handler, args, responseMsg)
    },

    apiGetAddressById: async function(req, res) {
            let id = req.params.id || {}
            handler = AddressesService.getAddressById
            args = {
                id
            }
            responseMsg = {
                success: "Successfully retrieved Address!"
            }
            stdRoute(req, res, handler, args, responseMsg)
    },

    apiSearchAddresses: async function(req, res) {
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
        handler = addressesService.searchAddresses
        args = {
            page,
            filters
        }
        responseMsg = {
            success: "Addresses Search Successful!"
        }
        stdRoute(req, res, handler, args, responseMsg)
    },

    apiFacetedSearch: async function(req, res, next) {
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
        
        handler = addressesService.facetedSearch
        args = {page, filters}
        responseMsg = {
            success: "Faceted Search Successful!"
        }

        stdRoute(req, res, handler, args, responseMsg)

    },
    
    getConfig(req, res) {
        handler = addressesService.getConfiguration
        args = {}
        const responseMsg = {
            success: "Configuration retrieved! "
        }
        stdRoute(req, res, handler, args, responseMsg)
    }

}