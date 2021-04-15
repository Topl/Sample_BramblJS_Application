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
}