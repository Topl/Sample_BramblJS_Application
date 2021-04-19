const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const UserService = require(`./users.service`)

const hashPassword = async password => bcrypt.hash(password, 10)

class User {
    constructor({name, email, password, keyfiles = {}} = {}) {
        this.name = name,
        this.email = email,
        this.password = password,
        this.keyfiles = keyfiles
    }
    toJson() {
        return {name: this.name, email: this.email, keyfiles: this.keyfiles}
    }
    async comparePassword(plainText) {
        return await bcrypt.compare(plainText, this.password)
    }
    encoded() {
        return jwt.sign(
            {
            exp: Math.floor(Date.now()/ 1000) + 60 * 60 * 4,
            ...this.toJson(),
        },
        process.env.SECRET_KEY,
        )
    }
    static async decoded(userJwt) {
        return jwt.verify(userJwt, process.env.SECRET_KEY, (error, res) => {
            if (error) {
                return {error}
            }
            return new User(res)
        }) 
    }
}

class UserController{
    static async register(req, res) {
        try {
            const userFromBody = req.userFromBody
            let errors = {}
            if (userFromBody && userFromBody.password.length < 8) {
                errors.password = "Your password must be at least 8 characters"
            }
            if (userFromBody && userFromBody.name.length < 3) {
                errors.name = "You must specify a name of at least 3 characters."
            }

            if (Object.keys(errors).length > 0) {
                res.status(400).json(errors)
                return
            }

            const userInfo = {
                ...userFromBody,
                password: await hashPassword(userFromBody.password)
            }

            const insertResult = await UserService.addUser(userInfo)
            if (!insertResult.success) {
                errors.email = insertResult.error
            } 
        
            if (Object.keys(errors).length > 0) {
                res.status(400).json(errors)
                return 
            }

            res.json({
                auth_token: insertResult.user.encoded(),
                info: insertResult.user.toJson(),
            })
        } catch (e) {
            res.status(500).json({error :e})
        }
    }

    static async login(req, res) {
        try {
            const {email, password} = req.body
            if (!email || typeof email !== "string") {
                res.status(400).json({error: "Bad email format, expected string."})
                return 
            }
            if (!password || typeof password !== "string") {
                res.status(400).json({error: "Bad password format, expected string."})
                return 
            }
            
            const loginResponse = await UsersService.loginUser(email, password)
            
            if (!loginResponse.success) {
                res.status(500).json({error: loginResponse.error})
                return
            }
            res.json({auth_token: loginResponse.user.encoded(), info: loginResponse.user.toJson()})
        } catch (e) {
            res.status(400).json({error: e})
            return 
        }
    }

    static async logout(req, res) {
        try {
            const userJwt = req.get("Authorization").slice("Bearer ".length)
            const userObj = await User.decoded(userJwt)
            var {error} = userObj
            if (error) {
                res.status(401).json({error})
                return
            }
            const logoutResult = await UsersService.logoutUser(userObj.email)
            var {error} = logoutResult
            if (error) {
                res.status(500).json({error})
                return
            }
            res.json(logoutResult)
        } catch (e) {
            res.status(500).json(e)
        }
    }

    static async delete(req, res) {
        try {
            let {password} = req.body
            if (!password || typeof password !== "string") {
                res.status(400).json({error: "Bad password format, expected string."})
                return
            }
            const userJwt = req.get("Authorization").slice("Bearer ".length)
            const userClaim = await User.decoded(userJwt)
            var { error } = userClaim
            if (error) {
                res.status(401).json({error})
                return
            }
            const deleteResult = await UsersService.deleteUser(userClaim.email, password)
            var {error} = deleteResult
            if (error) {
                res.status(500).json({error})
                return
            }
            res.json(deleteResult)
        } catch (e) {
            res.status(500).json(e)
        }
    }

    static async save(req, res) {
        try {
            const userJwt = req.get("Authorization").slice("Bearer ".length)
            const userFromHeader = await User.decoded(userJwt)
            var {error} = userFromHeader
            if (error) {
                res.status(401).json({error})
                return
            }

            const updatedUser = await UsersService.updateUser(userFromHeader.email)

            res.json({
                auth_token: updatedUser.encoded(),
                info: updatedUser.toJson(),
            })
        } catch (e) {
            res.status(500).json(e)
        }
    }

    // for internal use only
    static async createAdminUser(req, res) {
        try {
            const userFromBody = req.body
            let errors = {}
            if (userFromBody && userFromBody.password.length < 8) {
                errors.password = "Your password must be at least 8 characters."
            }
            if (userFromBody && userFromBody.name.length < 3) {
                errors.name = "You must specify a name of at least 3 characters."
            }

            if (Object.keys(errors).length > 0) {
                res.status(400).json(errors)
                return
            }

            const userInfo = {
                ...userFromBody, 
                password: await hashPassword(userFromBody.password),
            }

            const adminResult = await UsersService.makeAdmin(userInfo)
            if (!adminResult.success) {
                errors.email = insertResult.error
            }

            res.json({
                auth_token: adminResult.user.encoded(),
                info: adminResult.user.toJson(),
            })
        } catch (e) {
            res.status(500).json(e)
        }
    }
}

module.exports = UserController, User