const ObjectId = require('bson').ObjectID;

let keyfileDb
KeyfilesDAO = {
    /**
     * Finds all the keyfiles for a given email
     * @param {string} email - The email of the desired user
     * @returns {Object | null} Returns either an array of keyfiles, or nothing
     */

    getKeyfiles: async function(email) {
        let filter = email
        let result = await keyfileDb.findOne(
            {email: filter}
        )
        return result
    },

    /**
        * Finds and returns address keyfiles from one or more addresses. 
        * Returns a list of objects, each object represents a keyfile 
        * @param {string} address_id: The address
        * @returns {Promise<AddressResult>} A promise that will resolve to a list of AddressResults.
        * 
    */

    getKeyfileByAddress: async function(address_id) {
        let cursor
        try {
                // Let's find a keyfile for a given address. Because we're using findOne, we'll get a single object back.
                let filter = address
                cursor = await keyfileDb.findOne({address_id: filter})
                let {address_id, keyfile } = result
                console.log(result) 
        } catch (e) {
            console.error(`Unable to issue find command, ${e}`)
            return []
        }
        return cursor
    },
    /**
     * Gets a keyfile by its id
     * @param {string} id - The desired keyfile id, the _id in mongodb
     * @returns {KeyfileResult | null} Returns either a single Keyfile or nothing 
     */

    getKeyfileByID: async function(id) {
        try {
            /** 
             * Given a keyfile id, retrieve the keyfile for that id.
            */
        const pipeline = [
            {
                $match: {
                    _id: ObjectId(id)
                }
            }
        ] 
        return await keyfileDb(pipeline).next()
    } catch (e) {
        console.error(`Something went wrong in getKeyfileByID: ${e}`)
        throw e
    }
}


/** 
 * Represents a single keyfile result
 * @typedef KeyfileResult
 * @property {string} _id
 * @property {string} address - The address of the keyfile
 * @property {ToplCrypto} crypto - The cryptographical elements of the keyfile
*/

/** 
 * The cryptographical elements from a keyfile
 * @typedef ToplCrypto
 * @property {string} mac: used to ensure correct decryption of cipher text, fails when supplied password is wrong
 * @property {string} kdf: the function used to derive a key for encrypting/decrypting the ciphertext
 * @property {string} cipherText: a 64 byte encrypted, byte-wise concatenation of the Curve25519 keypair (private key + public key)
 * @property {string} kdfSalt: a randomization value used in the key derivation function
 * @property {string} cipher: The encryption scheme used to generate the cipherText
 * @property {CipherParams} cipherParams: Parameters used by the encryption scheme
*/

/** 
 * cipher parameters
 * @typedef CipherParams
 * @property {string} iv: a set of bytes used in the encryption scheme to obfuscate the output
*/

/** 
 * Success/Error return object
 * @typedef DAOResponse
 * @property {boolean} [success] - Success
 * @property {string} [error] - Error
*/
}

module.exports = KeyfilesDAO
