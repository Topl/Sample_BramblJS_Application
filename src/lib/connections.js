const connections = require('../../config/connections.json');
const networkType = connections.networks.connectApi
const network = connections.networks[networkType]
const networkUrl = network.networkUrl
const networkApiKey = network.apiKey
const projectId = network.projectId

Connections = {
    connections: connections,
    networkType: networkType,
    network: network,
    networkUrl: networkUrl,
    networkApiKey: networkApiKey,
    projectId: projectId
}

module.exports = Connections;