var BN = require('bn.js'); // handles topl balances

/**
 * Returns true if object is BN, otherwise false
 * @method isBN
 * @param {Object} object 
 * @return {Boolean}
 */
var isBN = function (object) {
    return BN.isBN(object);
}