const ObjectId = require('bson')
import e from "express"
import UsersDAO from "./usersDAO.mjs"

let addresses
let topl
const DEFAULT_SORT = [["polyBalance", -1]]
export default class AddressesDAO {
    static async injectDB(conn) {
        if (addresses) {
            return
        }
        try {
            topl = await conn.db(process.env.TOPL_NS)
            addresses = await conn.db(process.env.TOPL_NS).collection("addresses")
            this.addresses = addresses // this is only for testing
        } catch (e) {
            console.error(
                `Unable to establish a collection handle in addressesDAO: ${e}`,
            )
        }
    }
    /**
     * Retrieves the connection pool size, write concern and user roles on the current client.
     * @returns {Promise<ConfigurationResult>} An object with configuration details
     */
    static async getConfiguration() {
        const roleInfo = await topl.command({connectionStatus: 1})
        const authInfo = roleInfo.authInfo.authenticatedUserRoles[0]
        const {poolSize, wtimeout} = addresses.s.db.serverConfig.s.options
        let response = {
            poolSize,
            wtimeout,
            authInfo,
        }
        return response
    }
    /**
     * Inserts an address into the "addresses" collection with the following fields:
     * 
     * @param {*} address: The Base58 encoded address string
     * @param {*} title: a descriptive short title for this address
     * @param {*} polyBalance: The total polyBalance for this address
     * @param {*} trustRating: The level of trust that this asset has accumulated (that the data stored on the blockchain is reliable) 
     * @param {*} keyfileId: id for corresponding keyfile (if it has already been inserted into the db)
     * @param {string} date: The date on which the address was created
     */
    static async addAddress(address, title, polyBalance, trustRating, keyfileId, date) {
        try {
            address = address || "" 
            let insertResult = await addresses.insertOne({
                address: address,
                title: title,
                polyBalance: polyBalance,
                trustRating: trustRating,
                keyfileId: keyfileId,
                date: date
            })
            console.log("inserted address", insertedResult.address)

            //let's ensure that we can find the address that we just inserted with the insertion id that we just received

            if (await addresses.findOne({
                _id: ObjectId(insertResult.insertedId)
            })) {
                return {success: true, addressId: insertedResult.insertedId}
            } else {
                console.error(`Insert Address Unsuccessful`)
                return {error: `Insertion unsuccessful`}
            }
        } catch (e) {
            // return an error message stating we've tried to insert a duplicate key
            if (String(e).startsWith("MongoError: E11000 duplicate key error")) {
                return {error: "That address already exists!"}
            }
            console.error(`Error occurred while adding new address, ${e}.`)
            return {error: e}
        }
    }

    /**
     * Updates an address in the addresses collection. Note that unlike keyfiles, addresses are public and thus the fields such as the polyBalance and trustRating can be modified by the community to ensure accuracy. 
     * @param {string} addressId: The _id of this address to update
     * @param {string} title: The updated title for this address
     * @param {number} polyBalance: The updated polyBalance for this address
     * @param {number} trustRating: The updated trustRating for this address
     * @param {string | Date} date: The date on which the address was most recently updated.
     * @returns {DAOResponse} Returns either a "success" or an "error" object
     */
    static async updateAddress(addressId, title, polyBalance, trustRating, date) {
        try {
            const oldAddress = await addresses.findOne({_id: addressId})
            if (oldAddress) {
                const updateAddressResult = await addresses.updateOne(
                    {_id: addressId},
                    {
                        $set: {title: title},
                        $set: {polyBalance: polyBalance},
                        $set: {trustRating: trustRating},
                        $set: {date: date}
                    }
                )
                return updateAddressResult
            } else {
                console.error(`Update unsuccessful`)
                return {error: `Update unsuccessful`}
            }
        } catch(e) {
            console.error(`Error occurred while updating address ${e}`)
            return {error: e}
        }
    }

    /**
     * Ensures the delete operation is limited to only admin users of the system but not anybody else. 
     * @param {*} addressId address to be deleted
     * @param {*} email email of the user requesting the delete functionality
     */
    static async deleteAddress(addressId, email) {
        try {
            if (!(await UsersDAO.checkAdmin(email))) {
                console.error(`Deletion unsuccessful`)
                return {error: `Deletion unsuccessful`}
            }
            const deletedAddress = addresses.findOneAndDelete(
                {
                    _id: addressId         
                }
            )
            if (!(await this.getAddressByID(deletedAddress._id))) {
                return {success: true}
            } else {
                console.error(`Deletion unsuccessful`)
                return {error: `Deletion unsuccessful`}
            }
        } catch (e) {
            console.error(`Error occurred while deleting user, ${e}`)
            return {error: e}
        }
    }

    /**
     * Find and return addresses owned by one or more users.
     * Returns a list of objects, each object containing and address and an _id.
     * 
     * @param {string[]} users: The list of users
     * @returns {Promise<AddressResult>} A promise that will resolve to a list of AddressResults
     */
    static userSearchQuery(users) {
        const searchUsers = Array.isArray(users) ? users : users.split(", ")
        const query = {user_id: {$in: searchUsers}}
        const project = {}
        const sort = DEFAULT_SORT
        return {query, project, sort}
    }

    /**
     * Finds and returns addresses matching a given text in their title or description
     * @param {string} text - the text to match with
     * @returns {QueryParams} The QueryParams for text search
     */
    static textSearchQuery(text) {
        const query = {$text: {$search: text}}
        const meta_score = {$meta: "textScore"}
        const sort = [["score", meta_score]]
        const project = {score: meta_score}
        return {query, project, sort}
    }

    /**
     * 
     * @param {Object} filters - The search parameter to use in the query. Comes in the form of `{user_id: {$in: [...users]}}`
     * @param {number} page - The page of addresses to retrieve
     * @param {number} addressesPerPage - The number of addresses to display per page.
     * @param {FacetedSearchReturn} FacetedSearchReturn
     */
    static async facetedSearch({
        filters = null,
        page = 0,
        addressesPerPage = 20,
    } = {}) {
        if (!filters || !filters.user_id) {
            throw new Error("Must specify users to filter by.")
        }
        const matchStage = {$match:filters}
        const sortStage = {$sort: DEFAULT_SORT}
        const countingPipeline = [matchStage, sortStage, {$count: "count"}]
        const skipStage = {$skip: addressesPerPage * page}
        const limitStage = {$limit: addressesPerPage}
        const facetStage = {
            $facet: {
                polyBalance: [
                    {
                        $bucket: {
                            groupBy: "$polyBalance",
                            boundaries: [0, 100, 200, 300, 400],
                            default: "other",
                            output: {
                                count: {$sum: 1},
                            }
                        }
                    }
                ],
                trustRating: [
                    {
                        $bucket: {
                            groupBy: "$trustRating",
                            boundaries: [0, 50, 70, 90, 100],
                            default: "other",
                            output: {
                                count: {$sum: 1},
                            }
                        }
                    }
                ],
                addresses: [
                    {
                        $addFields: {
                            title: "$title",
                        },
                    },
                ],
            },
        }
        const queryPipeline = [
            matchStage,
            sortStage,
            skipStage,
            limitStage,
            facetStage
        ]

        try {
            const results = await( await addresses.aggregate(queryPipeline)).next()
            const count = await(await addresses.aggregate(countingPipeline)).next()
            return {
                ...results,
                ...count,
            }
        } catch (e) {
            return {error: "Results too large, be more restrictive in filter"}
        }
    }

    /**
     * Retrieves an address by its id
     * @param {string} id - the desired address id, the _id in the db
     * @returns {ToplAddress | null} Returns either a single address or nothing
     */
    static async getAddressByID(id) {
        try {
            // TODO Given an address ID, retrieve the keyfile matching that address
            const pipeline = [
                {
                    $match: {
                        _id: ObjectId(id)
                    },
                    $lookup: {
                        from: "keyfiles",
                        localField: "_id",
                        foreignField: "addressId",
                        as: "keyfile"
                    }
                }
            ]
            return await addresses.aggregate(pipeline).next()
        } catch (e) {
            console.error(`Error occurred while aattempting to retrieve address, ${e}`)
            return {error: e}
        }
    }
    /**
     * Finds and returns addresses
     * @param {Object} filters - The search parameters to use in the query
     * @param {number} page - The page of addresses to retrieve
     * @param {number} addressesPerPage - The number of addresses to display per page
     */
    static async getAddresses({
        // here's where the default parameters are set for the getAddresses method
        filters = null,
        page = 0,
        moviesPerPage = 20,
    } = {}
    ) {
        let QueryParams = {}
        if (filters) {
            if ("text" in filters) {
                queryParams = this.textSearchQuery(filters["text"])
            } else if ("users" in filters) {
                queryParams = this.userSearchQuery(filters["users"])
            }
        }

        let { query = {}, project = {}, sort = DEFAULT_SORT} = queryParams
        let cursor
        try {
            cursor = await addresses
                            .find(query)
                            .project(project)
                            .sort(sort)
        } catch (e) {
            console.error(`Unable to issue find command, ${e}`)
            return {addressesList: [], totalNumberAddresses: 0 }
        }

        // TODO Paging: Before returning back to the API, use the addressesPerPage and page arguments to decide which addresses to display

        const displayCursor = cursor.limit(addressesPerPage)
        try {
            const addressesList = await displayCursor.toArray()
            const totalNumAddresses = page === 0 ? await addresses.countDocuments(query) : 0

            return {addressesList, totalNumAddresses}
        } catch (e) {
            console.error(
                `Unable to convert cursor to array or problem counting documents ${e}`,
            )
            return {addressesList: [], totalNumAddresses: 0}
        }
    }

    /** 
     * This is a parsed query, sort, and project bundle
     * @typedef QueryParams
     * @property {Object} query - The specified query, transformed accordingly
     * @property {any[]} sort - The specified sort
     * @property {Object} project - The specified project, if any
    */

    /** 
     * Represents a single address result
     * @typedef AddressResult
     * @property {string} address - The address that was stored
     * @property {string} title - A string that is used to refer to this address
    */

    /** 
     * A Topl Address
     * @typedef ToplAddress
     * @property {string} _id
     * @property {string} address
     * @property {string} title
     * @property {string|Date} lastUpdatedDate
     * @property {number} polyBalance
     * @property {string[]} user_id
     * @property {string[]} trustRating
     * @property {string} keyfileId
    */

    /** 
     * Faceted search return
     * 
     * The type of return from faceted search. It will be a single document with 3 fields: trustRating, polyBalance, and addresses
     * @typedef FacetedSearchReturn
     * @property {object} trustRating
     * @property {object} polyBalance
     * @property {ToplAddress[]} addresses
    */

    


}