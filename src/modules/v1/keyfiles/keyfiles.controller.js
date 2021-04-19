const KeyfilesService = require('./keyfiles.service')

 class KeyfilesController {
    static async apiPostKeyfile(req, res) {
            const userJwt = req.get("Authorization").slice("Bearer ".length)
            const user = await User.decoded(userJwt)
            var {error} = user
            if (error) {
                res.status(401).json({error})
                return 
            }

            const addressId = req.body.address_id
            const keyfile = req.body.keyfile
            const date = new Date()
            const email = user.email

            handler = KeyfilesService.addKeyfile
            args = {
                addressId,
                email,
                keyfile,
                date
            }

            const responseMsg = {
                success: "success"
            }
            stdRoute(req, res, handler, args, responseMsg)
    }
 
    static async apiDeleteKeyfile(req, res) {
            const userJwt = req.get("Authorization").slice("Bearer ".length)
            const user = await User.decoded(userJwt)
            var {error} = user
            if (error) {
                res.status(401).json({error})
                return
            }

            const keyfileId = req.body.keyfile_id
            const userEmail = user.email
            const id = ObjectId(keyfileId)

            handler = KeyfilesService.deleteKeyfile
            args = {
                id,
                userEmail
            }

            responseMsg = {
                success: "Successfully deleted keyfile"
            }

            stdRoute(req, res, handler, args, responseMsg)
    } 

    static async apiGetKeyfileById(req, res) {
        let id = req.params.id || {}
        handler = KeyfilesService.getAddressById
        args
    } 
}

module.exports = KeyfilesController