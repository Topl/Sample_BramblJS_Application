const connections = require(`./connections`);
const network = connections.network;
const networkUrl = connections.networkUrl;
const projectId = connections.projectId;
const apiKey = connections.networkApiKey;
const numberToBN = require('number-to-bn');
const BramblJS = require('brambljs');
var BN = require('bn.js'); // handles topl balances
var utils = require('./bramblutils.js');
const { base } = require('../modules/v1/user/user.model');

var bramblJsRequests;
var brambljs;

const negative1 = new BN(-1);
const baseString = '1000000000';

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

module.exports = BramblJSObject;