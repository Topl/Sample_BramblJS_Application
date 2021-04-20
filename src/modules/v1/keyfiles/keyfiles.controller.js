const KeyfilesService = require('../keyfiles/keyfiles.service')
const stdRoute = require('../../../core/standardRoute')

 class KeyfilesController {
    static async apiPostKeyfile(req, res) {
            // const userJwt = req.get("Authorization").slice("Bearer ".length)
            // const user = await User.decoded(userJwt)
            // var {error} = user
            // if (error) {
            //     res.status(401).json({error})
            //     return 
            // Commenting out the authorization middleware based on conversation with Raul
            // }

            const addressId = req.body.address_id
            const keyfile = req.body.keyfile
            const email = req.body.email
            const address = req.body.address
            const network = req.body.network

            const handler = KeyfilesService.addKeyfile
            const args = {
                addressId:addressId,
                address: address,
                network: network,
                user_id: email,
                keyfile: keyfile
            }

            const responseMsg = {
                success: "Keyfile Created!"
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

            const handler = KeyfilesService.deleteKeyfile
            const args = {
                id,
                userEmail
            }

            const responseMsg = {
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