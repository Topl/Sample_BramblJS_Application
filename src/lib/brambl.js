const connections = require(`./connections`);
const network = connections.network;
const networkUrl = connections.networkUrl;
const projectId = connections.projectId;
const apiKey = connections.networkApiKey;
const BramblJS = require('brambljs');
var BN = require('bn.js'); // handles topl balances
var utils = require('./utils.js');

var bramblJsRequests;
var brambljs;

// Initialize brambljs and set request body to the url provided in the configuration
bramblJsRequests = {
    "url": `${networkUrl}${projectId}`,
    "apiKey": `${networkApiKey}`
};
brambljs = new BramblJS({
    networkPrefix: network.connectApi,
    Requests: bramblJsRequests
});


BramblJSObject = {
    request: bramblJsRequests,
    brambljs: brambljs,
    BigNumber: BigNumber,
    network: network
}

var fromNanoPoly = function(number, unit) {
    number = getUnitValue(unit);

    if (!utils.isBN(number) && !_.isString(number)) {
        throw new Error('Please pass numbers as strings or BN objects to avoid precision errors');
    }

    return utils.isBN(number) ? 
}

var getUnitValue = function(unit) {
    if (!unit === "poly") {
        throw new Error('This unit "' + unit + '"does\'t exist, please use "poly"');
    }
    return new BN(1e9);
}

module.exports = BramblJSObject;