const connections = require(`./connections`);
const network = connections.network;
const networkUrl = connections.networkUrl;
const projectId = connections.projectId;
const apiKey = connections.networkApiKey;
const BramblJS = require('brambljs');
var BigNumber = require('bignumber'); // handles topl balances

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

module.exports = BramblJSObject;