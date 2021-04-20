const User = require(`./user`)
const UserModel = require(`./user.model`)
const save2db = require('../../../lib/saveToDatabase');
const findAndUpdate = require('../../../lib/findOneAndUpdate');
const deleteFromDb = require(`../../../lib/deleteFromDb`)
const makeAdmin = require(`./lib/makeAdmin`)

const serviceName = "users";

class UsersService {
    static async addUser(userInfo) {
        try { 

            const user = new UserModel({
                firstName: userInfo.firstName,
                lastName: userInfo.lastName,
                email: userInfo.email
                }
            )

            const insertResult = await save2db(user, {serviceName: serviceName})
            if (!insertResult.success) {
                errors.email = insertResult.error
            }
            const userFromDb = this.getUser(userInfo)
            if (!userFromDb) {
                errors.general = "Internal error, please try again later!"
            }

            if (Object.keys(errors).length > 0) {
                return errors
            }

            return {success: true, user: new User(userFromDb)}
        } catch (e) {
            return {error: e}
        }
    }

    static async getUser(userObj) {
        return await UserModel.findOne({email: userObj.email})
    }

    static async deleteUser(userObj) {
        try {
            const deleteResult = await deleteFromDb(UserModel, {email: userObj.email}, {serviceName:serviceName})
            var {error} = deleteResult
            if (error) {
                return {error}
            }
            return deleteResult
        } catch (e) {
            return e
        }
    }

    static async updateUser(userObj) {
        
        try {

            const userModel = await UserModel({
                name: userObj.name,
                email: userObj.email
            })

            findAndUpdate(userModel, {serviceName: serviceName, upsert: false})
            const userFromDb = this.getUser(userObj)
            return updatedUser = new User(userFromDb)
        } catch (e) {
            return e
        }
    }
    
    static async makeAdmin(userObj) {
        try {
            let errors = {}
            const userModel = await UserModel({
                name: userObj.name,
                email: userObj.email
            })

           const insertResult = await this.addUser(userObj)
           if (!insertResult.success) {
               errors.email = insertResult.error
           }
           if (Object.keys(errors).length > 0) {
               return errors
           }

           const makeAdminResponse = findAndUpdate(models = userModel, updates = {$set:{isAdmin:true}}, filters = {user_id: userModel.email}, opts = {serviceName: serviceName, upsert: false})
           const userFromDb = this.getUser(userObj)
           if (!userFromDb) {
               errors.general = "Internal error, please try again later!"
           }

           if (Object.keys(errors).length > 0) {
               return errors
           }

           const user = new User(userFromDb)
           const loginResponse = this.loginUser(user.email, userObj.password)
           return {success:true, user: user}

        } catch (e) {
            return {error: e}
        }
    }

    static async checkAdmin(email) {
        try {
            const {isAdmin} = await this.getUser(email)
            return isAdmin || false
        } catch (e) {
            return {error: e}
        }
    }
}

module.exports =  UsersService