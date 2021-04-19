import { resolve } from 'bluebird';
import BramblJS from require('brambl.js');
const brambljs = BramblJS.brambljs
const BigNumber = BramblJS.BigNumber;

export default class BramblHelper {

    /**
     * Generates a new public address and private key file and stores private keyfile in the DB
     * @return {Promise} object with address and keyfile
     */
    static async createAddress() {
        return new Promise(((resolve, reject) => {
            a = brambljs.KeyManager.address;
            kf = brambljs.KeyManager.getKeyStorage();

            Address = {
                address: a,
                keyfile: kf
            };

            console.log('new address', a);
            resolve(Address);      
        }))
    }

    /**
     * Get the poly and nanopoly balances for a valid address
     * @param {string} address 
     * @return {Promise} Promise obj with data or error
     */
    static async getBalance(address) {
        let obj = {};
        let e = await brambljs.requests.lookupBalancesByAddresses({addresses: [address]})
                    .then(function(result) {
                        obj.nanoPolyBalance = result.result[address].Balances.Polys
                        obj.polyBalance = brambljs.fromNanoPoly(result, "poly");
                        console.log('obj', obj);
                        return obj;
                    }).catch(function (err) {
                        console.log(err.message);
                        return obj.error = err.message;
                });
        return e;
    }
}