const User = require(`./user`)
const UserModel = require(`./user.model`)
const SessionsService = require('../sessions/sessions.service')
const save2db = require('../../../lib/saveToDatabase');
const findAndUpdate = require('../../../lib/findOneAndUpdate');
const deleteFromDb = require(`../../../lib/deleteFromDb`)
const makeAdmin = require(`./lib/makeAdmin`)

const serviceName = "users";

UsersService = {
    addUser: async function(userInfo) {
        try { 

            const user = new UserModel({
                name: userInfo.name,
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
    },

    getUser: async function (userObj) {
        const userModel = await UserModel({
            name: userObj.name,
            email: userObj.email
            })
        return await userModel.findOne({email: userObj.email})
    },

    loginUser: async function(userObj) {
        try {
            const user = new User(this.getUser(userObj))

            if (!user) {
                return {error: "Make sure your email is correct"}
            }

            if (!(await user.comparePassword(userObj.password))) {
                return {error: "Make sure your password is correct."}
            }

            const loginResponse = await SessionsService.loginUser(user.email, user.encoded())

            if (!loginResponse.success) {
                return {error: loginResponse.error}
            }

            return {success: true, user: user}

        } catch (e) {
            return {error: e}
        }
 
    },

    logoutUser: async function(email) {
        try {
            const logoutResult = SessionsService.logoutUser(email)
            var {error} = logoutResult
            if (error) {
                return {error}
            }
            return logoutResult
        } catch (e) {
            return e;
        }
    },

    deleteUser: async function(userObj) {
        try {
            const user = new User(this.getUser(userObj))
            if (!(await user.comparePassword(userObj.password))) {
                return {error: "Make sure your password is correct."}
            }
            const deleteResult = await deleteFromDb(UserModel, {email: userObj.email}, {serviceName:serviceName})
            var {error} = deleteResult
            if (error) {
                return {error}
            }
            return deleteResult
        } catch (e) {
            return e
        }
    },

    updateUser: async function(userObj) {
        
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
    },
    
    makeAdmin: async function(userObj) {
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

           const makeAdminResponse = findAndUpdate(models = userModel, updates = {$set:{isAdmin:true}}, filters = {user_id: userModel.email}, opts = {serviceName: serviceName, upsert = false})
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
    },

    checkAdmin: async function(email) {
        try {
            const {isAdmin} = await this.getUser(email)
            return isAdmin || false
        } catch (e) {
            return {error: e}
        }
    }
}