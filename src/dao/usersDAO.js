let users
let sessions

export default class UsersDAO {
    static async injectDB(conn) {
        if (users && sessions) {
            return
        }
        try {
            users = await conn.db(process.env.TOPL_NS).collection("users")
            sessions = await conn.db(process.env.TOPL_NS).collection("sessions")
        } catch (e) {
            console.error(`Unable to establish collection handles in usersDao: ${e}`)
        }
    }

    /**
     * Finds a user in the `users` collection
     * @param {string} email - The email of the desired user
     * @returns {Object | null} Returns either a single user or nothing 
     */
    static async getUser(email) {
        let filter = email
        let result = await users.findOne({email: filter})
        return result
    }

    static async addUser(userInfo) {
        try {
            // TODO: Insert a user with the "name", "email", and "password" fields.
            let insertResult = await users.insertOne({
                name: userInfo.name,
                email: userInfo.email,
                password: userInfo.password
            })
            console.log("inserted _id", insertedResult.insertedId)

            // let's ensure that we can find the user that we just inserted with the insertedId that we just received
            if (await users.findOne({
                _id: ObjectId(insertResult.insertedId)
            })) {
                return {success: true}
            } else {
                console.error(`Insert unsuccessful`)
                return {error: `Insertion unsuccessful`}
            }
        } catch (e) {
            // return an error message stating we've tried to insert a duplicate key
            if (String(e).startsWith("MongoError: E11000 duplicate key error")) {
                return {error: "A user with the given email already exists"}
            }
            console.error(`Error occurred while adding new user, ${e}.`)
            return {error: e}
        }
    }
    /**
     * Adds a user to the `sessions` collection
     * @param {string} email - the email of the user to login
     * @param {string} jwt - A JSON web token representing the user's claims
     * @returns {DAOResponse} Returns either a "success" or an "error" Object 
     */
    static async loginUser(email, jwt) {
        try {
            // we are not sure if the session exists in our collection, but we want to make sure that there is a session in the collection
            // This operation may do one of two things:

            // If the predicate matches a session, update the session to contain the correct JWT
            // If the user doesn't exist, create the desired session
            const newSession = {
                email: email,
                jwt: jwt
            }

            const upsertResult = await users.updateOne(
                {
                   user_id: email 
                },
                {
                    $set: jwt
                },
                {upsert: true},
            )
            return {success: true}
        } catch (e) {
            console.error(`Error occurred while logging in user, ${e}`)
            return { error: e }
        }
    }
    /**
     * removes a user from the `sessions` collection
     * @param {string} email - the email of the user to logout
     * @returns {DAOResponse} Returns either a "success" or an "error" Object
     */
    static async logoutUser(email) {
        try {
            let deleteSession = await sessions.deleteOne({user_id: email})
            let countSessions = await sessions.count({})
            console.log(countDocuments)
            // Should decrement the count of the sessions by one
            return {success: true}
        } catch (e) {
            console.error(`Error occurred while logging out user, ${e}`)
            return {error: e}
        }
    }
    /**
     * Gets a user from the `sessions` collection
     * @param {string} email - The email of the user to search for in `sessions`
     * @returns {Object | null} Returns a user session object, an "error" object if something went wrong, or null if the user was not found
     */
    static async getUserSession(email) {
        try {
            let filter = email
            let result = await sessions.findOne({user_id: email})
            return result
        } catch (e) {
            console.error(`Error occurred while retrieving user session, ${e}`)
            return null
        }
    }

    static async updateUser(email, password) {
        try {
            const oldUser = await users.findOne({user_id: email})
            if (oldUser) {
                const updateUserResult = await users.updateOne(
                    {user_id: email},
                    {
                        $set: {password: password}
                    }
                )
                return updateUserResult
            } else {
                console.error("Update unsuccessful")
                return {error: "Update unsuccessful"}
            }
        } catch (e) {
            console.error(`Error occurred while updating keyfile, ${e}`)
            return {error: e}
        }
    }

    /**
     * Removes a user from the `sessions` and `users` collections
     * @param {string} email - The email of the user to delete
     * @returns {DAOResponse} Returns either a "success" or an "error" object
     */
    static async deleteUser(email) {
        try {
            await users.deleteOne({email})
            await sessions.deleteOne({user_id: email})
            if (!(await this.getUser(email)) && !(await this.getUserSession(email))) {
                return {success: true}
            } else {
                console.error('Deletion unsuccessful')
                return {error: `Deletion unsuccessful`}
            }
        } catch (e) {
            console.error(`Error occurred while deleting user, ${e}`)
            return {error: e}
        }
    }
    
    static async checkAdmin(email) {
        try {
            const {isAdmin} = await this.getUser(email)
            return isAdmin || false
        } catch(e) {
            return {error: e}
        }
    }

    static async makeAdmin(email) {
        try {
            const updateResponse = users.updateOne(
                {email},
                {$set: {isAdmin: true}},
            )
            return updateResponse
        } catch (e) {
            return {error: e}
        }
    }

    /** 
     * Parameter passed to addUser method
     * @typedef userInfo
     * @property {string} name
     * @property {string} email
     * @property {string} password
    */

    /** 
     * Success/Error return object
     * @typedef DAOResponse
     * @property {boolean} [success] - Success
     * @property {string} [error] - Error
    */

    
}