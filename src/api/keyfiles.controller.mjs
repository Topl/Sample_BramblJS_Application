import UsersDAO from "../dao/usersDAO.mjs"
import KeyfilesDAO from "../dao/keyfilesDAO.mjs"
import { User } from "./users.controller.mjs"
import pkg from 'bson';
const {ObjectId} = pkg;
import AddressesDAO from "../dao/addressesDAO.mjs"

export default class KeyfilesController {
    static async apiPostKeyfile(req, res, next) {
        try {
            const userJwt = req.get("Authorization").slice("Bearer ".length)
            const user = await User.decoded(userJwt)
            var {error} = user
            if (error) {
                res.status(401).json({error})
                return
            }

            const addressId = req.body.address_id
            const keyfile = req.body.keyfile
            const keyfilePassword = req.body.password
            const date = new Date()

            const keyfileResponse = await KeyfilesDAO.addKeyfile(
                addressId,
                user.email,
                keyfile,
                keyfilePassword,
                date,
            )

            const updatedAddress = await AddressesDAO.getAddressByID(addressId)

            res.json({status: "success", keyfileId: updatedAddress.keyfileId})
        } catch (e) {
            res.status(500).json({e})
        }
    }
 
    static async apiUpdateKeyfile(req, res, next) {
        try {
            const userJwt = req.get("Authorization").slice("Bearer ".length)
            const user = await User.decoded(userJwt)
            var { error } = user
            if (error) {
                res.status(401).json({error})
                return
            }

            const keyfileId = req.body.keyfile_id
            const keyfilePassword = req.body.password
            const date = new Date()

            const keyfileResponse = await KeyfilesDAO.updateKeyfile(
                ObjectId(keyfileId),
                user.email,
                keyfilePassword,
                date
            )

            var {error} = keyfileResponse
            if (error) {
                res.status(400).json({error})
            }

            if (keyfileResponse.modifiedCount === 0) {
                throw new Error(
                    "unable to update keyfile - user may not be original owner of keyfile"
                )
            }

            const addressId = req.body.address_id
            const updatedAddress = await AddressesDAO.getKeyfileByAddress(addressId)

            res.json({keyfile_id: updatedAddress.keyfileId})
        } catch (e) {
            res.status(500).json({e})
        }
    }

    static async apiDeleteKeyfile(req, res, next) {
        try {
            const userJwt = req.get("Authorization").slice("Bearer ".length)
            const user = await User.decoded(userJwt)
            var {error} = user
            if (error) {
                res.status(401).json({error})
                return
            }

            const keyfileId = req.body.keyfile_id
            const userEmail = user.email
            const keyfileResponse = await KeyfilesDAO.deleteKeyfile(
                ObjectId(keyfileId),
                userEmail,
            )

            const addressId = req.body.address_id

            const {keyfile} = await AddressesDAO.getKeyfileByID(addressId)
            res.json({keyfileId})
        } catch (e) {
            res.status(500).json({e})
        }
    }
}