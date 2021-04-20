const UserModel = require(`./user.model`)
const save2db = require('../../../lib/saveToDatabase');
const findAndUpdate = require('../../../lib/findOneAndUpdate');
const deleteFromDb = require(`../../../lib/deleteFromDb`);
const stdErr = require(`../../../core/standardError`);
const makeAdmin = require(`./lib/makeAdmin`);
const {checkExists} = require('../../../lib/validation');
const mongoose = require("mongoose");

const serviceName = "users";

class UsersService {
    static async addUser(userInfo) {
        try { 

            const timestamp = new Date();
            userInfo.dateCreated = timestamp;
            userInfo.lastUpdated = timestamp;
            userInfo.isActive = {
                status: true,
                asOf: timestamp
            };

            const newUser = new UserModel(userInfo);

            const insertResult = await save2db(newUser, {serviceName: serviceName})
            return newUser.toJSON();
        } catch (err) {
            if (err.name === "MongoError" && err.code === 11000) {
                throw stdErr(422, "The provided email is already in use", serviceName, serviceName);
            } else {
                throw err;
            }
        }
    }

    static async getUser(args) {
        try {
            // Access Control
            const [isAdmin, fetchedUser] = await Promise.all([
                UsersService.checkAdmin(args.userEmail),
                checkExists(UserModel, args.requestedEmail, {serviceName})
            ]);
            if (!isAdmin && ! (args.requestedEmail === args.userEmail)) {
                throw stdErr(403, "Not Authorized", serviceName, serviceName);
            }

            if (fetchedUser.isActive.status) {
                return fetchedUser.toJSON();
            } else {
                throw stdErr(404, "No Active User Found", serviceName, serviceName);
            }
        } catch (err) {
            throw err;
        } 
    }

    static async deleteUser(userObj) {
        try {
            console.log("Backend Delete Route")
            const [isAdmin, fetchedUser] = await Promise.all([
                UsersService.checkAdmin(userObj.userEmail),
                checkExists(UserModel, userObj.requestedEmail, {serviceName})
            ]);

            // check for active user
            if (!fetchedUser || !fetchedUser.isActive.status) {
                throw stdErr(404, "No Active User Found", serviceName, serviceName);
            }

            // access control
            if (!isAdmin || !(userObj.userEmail === userObj.requestedEmail)) {
                throw stdErr(403, "Not Authorized", serviceName, serviceName)
            }

            // check if they are the owner of any addresses
            if (fetchedUser.addresses.length > 0) {
                throw stdErr(400, "Please delete or transfer ownership of your keyfiles before deleting your account", serviceName, serviceName);
            }

            // mark user as inactive
            const timestamp = new Date();
            fetchedUser.isActive.status = false;
            fetchedUser.isActive.asOf = timestamp;
            fetchedUser.lastUpdated = timestamp;
            fetchedUser.markModified("isActive.status");
            fetchedUser.markModified("isActive.asOf");

            await save2db(fetchedUser, {timestamp, serviceName});
            return {}
        } catch (err) {
            throw err;
        }
    }

    static async updateUser(userObj) {
        const session = await mongoose.startSession();
        try {
            // Access Control
            const [isAdmin, fetchedUser] = await Promise.all([
                UsersService.checkAdmin(userObj.userEmail),
                checkExists(UserModel, userObj.changeEmail, {serviceName})
            ]);

            if (!isAdmin && !(userEmail === changeEmail)) {
                throw stdErr(403, "Not authorized", serviceName, serviceName);
            };

            const timestamp = Date.now();
            // check if user is active
            if (!fetchedUser.isActive.status) {
                throw stdErr(404, "No Active User Found", serviceName, serviceName);
            }

            // Apply updates
            if (userObj.newEmail) {
                fetchedUser.email = userObj.newEmail;
            }

            if (userObj.firstName) {
                fetchedUser.firstName = firstName;
            }

            if (userObj.lastName) {
                fetchedUser.lastName = lastName;
            }

            await save2db(fetchedUser, {timestamp, serviceName, session});
            const userFromDb = this.getUser(userObj)
            return fetchedUser.toJSON();
        } catch (err) {
            throw err;
        } finally {
            session.endSession();
        }
    }
    
    // static async makeAdmin(userObj) {
    //     try {
    //         let errors = {}
    //         const userModel = await UserModel({
    //             name: userObj.name,
    //             email: userObj.email
    //         })

    //        const insertResult = await this.addUser(userObj)
    //        if (!insertResult.success) {
    //            errors.email = insertResult.error
    //        }
    //        if (Object.keys(errors).length > 0) {
    //            return errors
    //        }

    //        const makeAdminResponse = findAndUpdate(models = userModel, updates = {$set:{isAdmin:true}}, filters = {user_id: userModel.email}, opts = {serviceName: serviceName, upsert: false})
    //        const userFromDb = this.getUser(userObj)
    //        if (!userFromDb) {
    //            errors.general = "Internal error, please try again later!"
    //        }

    //        if (Object.keys(errors).length > 0) {
    //            return errors
    //        }

    //        const user = new User(userFromDb)
    //        const loginResponse = this.loginUser(user.email, userObj.password)
    //        return {success:true, user: user}

    //     } catch (e) {
    //         return {error: e}
    //     }
    // }

    static async checkAdmin(email) {
        try {
            const {isAdmin} = await checkExists(UserModel, email, {serviceName})
            return isAdmin.role === "PRIVILIGED" || false
        } catch (e) {
            return {error: e}
        }
    }
}

module.exports =  UsersService