const mainnet = require("./mainnet.json");
const valhalla = require("./valhalla.json");
const privateTestNet = require("./private.json");
const local = require("./local.json");

function _getInitializedNetworks(customNetworks) {
  const names = {
    "1": "toplnet",
    "2": "valhalla",
    "3": "private",
    "4": "local"
  };

  const networks = { mainnet, valhalla, privateTestNet, local };

  if (customNetworks) {
    for (const network of customNetworks) {
      const name = network.name;
      names[network.networkId.toString()] = name;
      networks[name] = network;
    }
  }

  networks["names"] = names;
  return networks;
}

module.exports = _getInitializedNetworks;
