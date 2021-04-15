const Address = require("./addresses.model")
const mongoose = require('mongoose')
const brambl = require('../../../lib/brambl.js')
var BigNumber = require('bignumber.js');//handles topl poly balances

const stdErr = require('../../../core/standardError')
const save2db = require('../../../lib/saveToDatabase')

const serviceName = 'Address'

class AddressesService {

    static getTest() {
        return "Topl Sample API"
    }

    static async create() {
        return brambl.createAddress()
    }

    static async postAddress(keyfileId, title, trustRating, address) {
        const date = new Date()
        const polyBalance = new BigNumber()
    }
}