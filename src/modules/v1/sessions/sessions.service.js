const findAndUpdate = require('../../../lib/findOneAndUpdate');
const deleteFromDb = require(`../../../lib/deleteFromDb`);
const Session = require(`../sessions/sessions.model`);

const serviceName = "session";

SessionsService = {
    loginUser: async function(email, jwt) {
        try {
            // we are not sure if the session exists in our collection, but we want to make sure that there is a session in the collection
            // This operation may do one of two things:

            // If the predicate matches a session, update the session to contain the correct JWT
            // If the user doesn't exist, create the desired session
            const newSession = {
                email: email,
                jwt: jwt
            };

            const upsertResult = await findAndUpdate(Session, {$set: jwt}, {user_id: email}, opts = {serviceName: serviceName});
            return {success: true};
        } catch (e) {
            console.error(`Error occurred while logging in user, ${e}`);
            return {error: e};
        }
    },

    /**
     * Removes a user from the `sessions` collection
     * @param {string} email - the email of the user to logout
     * @returns {DAOResponse} Returns either a "success" or an "error" Object
     */
    logoutUser: async function(email) {
        try {
            deleteSession = deleteFromDb(Session, {user_id: email}, {adminOnly: false, serviceName: serviceName} )
            return {success: true}
        } catch (e) {
            console.error(`Error occurred while logging out user, ${e} `)
            return {error: e}
        }
    },
    /**
     * Gets a user from the `sessions` collection
     * @param {string} email - The email of the user to search for in `sessions`
     * @returns {Object | null} Returns a user session object, an "error" object if something went wrong, or null if the user was not found 
     */ 
    getUserSession: async function(email) {
        try {
            let result = Session.findOne({user_id: email})
            return result
        } catch (e) {
            console.error(`Error occurred while retrieving user session, ${e}`)
            return null
        }
    }
}

module.exports = UsersHelper