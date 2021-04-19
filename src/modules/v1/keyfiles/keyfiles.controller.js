const KeyfilesService = require('./keyfiles.service')
const keyfilesService = new KeyfilesService()

 KeyfilesController = {
    apiPostKeyfile: async function(req, res) {
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

            handler = keyfilesService.addKeyfile
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
    }, 
 
    // apiUpdateKeyfile: async function(req, res) {
    //         const userJwt = req.get("Authorization").slice("Bearer ".length)
    //         const user = await User.decoded(userJwt)
    //         var { error } = user
    //         if (error) {
    //             res.status(401).json({error})
    //             return
    //         }

    //         const keyfileId = req.body.keyfile_id
    //         const date = new Date()
    //         const email = user.email
    //         const id = ObjectId(keyfileId)

    //         handler = keyfilesService.updateKeyfile
    //         args = {
    //             id,
    //             email,
    //             date
    //         }

    //         responseMsg = {
    //             success: "Successfully updated keyfile"
    //         }
            
    //         stdRoute(req, res, handler, args, responseMsg)
    // },
    // Currently keyfiles are immutable, this decision can be different depending on the metadata that the implementation decides to add to the keyfile storage

    apiDeleteKeyfile: async function(req, res) {
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

            handler = keyfilesService.deleteKeyfile
            args = {
                id,
                userEmail
            }

            responseMsg = {
                success: "Successfully deleted keyfile"
            }

            stdRoute(req, res, handler, args, responseMsg)
    }, 

    apiGetKeyfileById: async function(req, res) {
        let id = req.params.id || {}
        handler = keyfilesService.getAddressById
        args
    } 
}