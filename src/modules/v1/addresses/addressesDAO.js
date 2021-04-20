const ObjectId = require('bson')
const e = require("express")

let addresses
let topl
const DEFAULT_SORT = [["polyBalance", -1]]
AddressesDAO = {
    /**
     * Find and return addresses owned by one or more users.
     * Returns a list of objects, each object containing and address and an _id.
     * 
     * @param {string[]} users: The list of users
     * @returns {Promise<AddressResult>} A promise that will resolve to a list of AddressResults
     */
    userSearchQuery: function (users) {
        const searchUsers = Array.isArray(users) ? users : users.split(", ")
        const query = {user_id: {$in: searchUsers}}
        const project = {}
        const sort = DEFAULT_SORT
        return {query, project, sort}
    },

    /**
     * Finds and returns addresses matching a given text in their title or description
     * @param {string} text - the text to match with
     * @returns {QueryParams} The QueryParams for text search
     */
    textSearchQuery: function(text) {
        const query = {$text: {$search: text}}
        const meta_score = {$meta: "textScore"}
        const sort = [["score", meta_score]]
        const project = {score: meta_score}
        return {query, project, sort}
    },

    /**
     * 
     * @param {Object} filters - The search parameter to use in the query. Comes in the form of `{user_id: {$in: [...users]}}`
     * @param {number} page - The page of addresses to retrieve
     * @param {number} addressesPerPage - The number of addresses to display per page.
     * @param {FacetedSearchReturn} FacetedSearchReturn
     */
    facetedSearch: async function({
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
    },

    /**
     * Retrieves an address by its id
     * @param {string} id - the desired address id, the _id in the db
     * @returns {ToplAddress | null} Returns either a single address or nothing
     */
    getAddressByID: async function(id) {
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
    },
    /**
     * Finds and returns addresses
     * @param {Object} filters - The search parameters to use in the query
     * @param {number} page - The page of addresses to retrieve
     * @param {number} addressesPerPage - The number of addresses to display per page
     */
    getAddresses: async function({
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

module.exports = AddressesDAO