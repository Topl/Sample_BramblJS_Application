const UserModel = require(`./user.model`);
const save2db = require("../../../lib/db/saveToDatabase");
const stdErr = require(`../../../core/standardError`);
const { checkExists } = require("../../../lib/validation");
const { waitForMongooseConnection } = require("../../../lib/db/mongodb");
const mongoose = require("mongoose");
const stdError = require("../../../core/standardError");

const serviceName = "users";

class UsersService {
    static async addUser(userInfo) {
        await waitForMongooseConnection();
        const session = await mongoose.startSession();
        try {
            const timestamp = new Date();
            userInfo.dateCreated = timestamp;
            userInfo.lastUpdated = timestamp;
            userInfo.isActive = {
                status: true,
                asOf: timestamp,
            };

            const newUser = new UserModel(userInfo);

            await save2db(newUser, { timestamp, serviceName, session });
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
                checkExists(UserModel, args.requestedEmail, "email"),
            ]);
            if (!isAdmin && !(args.requestedEmail === args.userEmail)) {
                throw stdErr(403, "Not Authorized", serviceName, serviceName);
            }

            if (fetchedUser.doc.isActive.status) {
                return fetchedUser.doc.toJSON();
            } else {
                throw stdErr(404, "No Active User Found", serviceName, serviceName);
            }
        } catch (err) {
            throw err;
        }
    }

    static async deleteUser(userObj) {
        await waitForMongooseConnection();
        const session = await mongoose.startSession();
        try {
            const [isAdmin, fetchedUser] = await Promise.all([
                UsersService.checkAdmin(userObj.userEmail),
                checkExists(UserModel, userObj.requestedEmail, "email"),
            ]);

            // check for active user
            if (!fetchedUser.doc || !fetchedUser.doc.isActive.status) {
                throw stdErr(404, "No Active User Found", serviceName, serviceName);
            }

            // access control
            if (!isAdmin && !(userObj.userEmail === userObj.requestedEmail)) {
                throw stdErr(403, "Not Authorized", serviceName, serviceName);
            }

            // check if they are the owner of any addresses
            if (fetchedUser.doc.addresses.length > 0) {
                throw stdErr(
                    400,
                    "Please delete or transfer ownership of your keyfiles before deleting your account",
                    serviceName,
                    serviceName
                );
            }

            // mark user as inactive
            const timestamp = new Date();
            fetchedUser.doc.isActive.status = false;
            fetchedUser.doc.isActive.asOf = timestamp;
            fetchedUser.doc.lastUpdated = timestamp;
            fetchedUser.doc.markModified("isActive.status");
            fetchedUser.doc.markModified("isActive.asOf");

            await save2db(fetchedUser.doc, { timestamp, serviceName, session }).catch(function (err) {
                console.error(err);
                throw stdError(500, err, serviceName, serviceName);
            });
            return {};
        } catch (err) {
            throw err;
        }
    }

    static async updateUser(userObj) {
        await waitForMongooseConnection();
        const session = await mongoose.startSession();
        try {
            // Access Control
            const [isAdmin, fetchedUser] = await Promise.all([
                UsersService.checkAdmin(userObj.user_id),
                checkExists(UserModel, userObj.changeEmail, "email"),
            ]);

            if (!isAdmin && !(userObj.userEmail === userObj.changeEmail)) {
                throw stdErr(403, "Not authorized", serviceName, serviceName);
            }

            const timestamp = Date.now();
            // check if user is active
            if (!fetchedUser.doc.isActive.status) {
                throw stdErr(404, "No Active User Found", serviceName, serviceName);
            }

            // Apply updates
            if (userObj.newEmail) {
                fetchedUser.doc.email = userObj.newEmail;
            }

            if (userObj.firstName) {
                fetchedUser.doc.firstName = userObj.firstName;
            }

            if (userObj.lastName) {
                fetchedUser.doc.lastName = userObj.lastName;
            }

            await save2db(fetchedUser.doc, { timestamp, serviceName, session });
            return fetchedUser.doc.toJSON();
        } catch (err) {
            throw err;
        } finally {
            session.endSession();
        }
    }

    static async checkAdmin(email) {
        try {
            const { isAdmin } = await checkExists(UserModel, email, "email");
            return isAdmin.doc.role === "PRIVILIGED" || false;
        } catch (e) {
            return { error: e };
        }
    }
}

module.exports = UsersService;
