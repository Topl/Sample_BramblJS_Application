const connections = require(`./connections`);
const network = connections.network;
const networkUrl = connections.networkUrl;
const projectId = connections.projectId;
const apiKey = connections.networkApiKey;
const BramblJS = require('brambljs');
const BramblUtils = require('./bramblutils');
var BN = require('bn.js'); // handles topl balances


class BramblHelper {

    constructor(password) {
        // Initialize bramblJS and set request body to the url provided in the configuration
        bramblJsRequests = {
            "url": `${networkUrl}${projectId}`,
            "apiKey": `${apiKey}`
        };

        this.brambljs = new BramblJS({
            networkPrefix: network.connectApi,
            Requests: bramblJsRequests,
            password: password
        });
    }

    /**
     * Generates a new public address and private key file and stores private keyfile in the DB
     * @return {Promise} object with address and keyfile
     */
    async createAddress() {
        return new Promise(((resolve, reject) => {
            a = this.brambljs.KeyManager.address;
            kf = this.brambljs.KeyManager.getKeyStorage();

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
    async getBalance(address) {
        let obj = {};
        let e = await this.brambljs.requests.lookupBalancesByAddresses({addresses: [address]})
                    .then(function(result) {
                        obj.nanoPolyBalance = result.result[address].Balances.Polys
                        obj.polyBalance = BramblUtils.fromNanoPoly(result, "poly");
                        console.log('obj', obj);
                        return obj;
                    }).catch(function (err) {
                        console.log(err.message);
                        return obj.error = err.message;
                });
        return e;
    }
}