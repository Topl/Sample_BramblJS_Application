const connections = require(`./connections`);
const networkUrl = connections.networkUrl;
const apiKey = connections.networkApiKey;
const BramblJS = require("brambljs");
const Constants = require("../util/constants");

class BramblHelper {
  constructor(readOnly, password, network, keyfilePath) {
    if (!readOnly) {
      this.brambljs = new BramblJS({
        networkPrefix: network, // applies to both Requests and KeyManager
        Requests: {
          url: `${networkUrl}`,
          apiKey: `${apiKey}`
        },
        KeyManager: {
          password: password,
          keyPath: keyfilePath ? `private_keyfiles/${keyfilePath}` : ""
        }
      });
    } else {
      this.requests = BramblJS.Requests(network, networkUrl, apiKey);
    }
  }

  /**
   * Generates a new public address and private key file and stores private keyfile in the DB
   * @return {Promise} object with address and keyfile
   */
  async createAddress() {
    return new Promise(resolve => {
      const a = this.brambljs.keyManager.address;
      const kf = this.brambljs.keyManager.getKeyStorage();

      const Address = {
        address: a,
        keyfile: kf
      };

      //console.log("new address", a);
      resolve(Address);
    });
  }

  async getBalance(address) {
    let obj = {};
    let e = await this.requests
      .lookupBalancesByAddresses({
        addresses: [address]
      })
      .then(function(result) {
        obj.polyBalance = result.result[address].Balances.Polys;
        obj.arbitsBalance = result.result[address].Balances.Arbits;
        //console.log("obj", obj);
        return obj;
      })
      .catch(function(err) {
        //console.log(err.message);
        return (obj.error = err.message);
      });
    return e;
  }

  async getBlockNumber() {
    let obj = {};
    let e = await this.requests
      .getLatestBlock()
      .then(function(result) {
        obj.blockHeight = result.result.height;
        return obj;
      })
      .catch(function(err) {
        //console.log(err.message);
        return (obj.error = err.message);
      });
    return e;
  }

  async getTransactionFromMempool(transactionId) {
    let obj = {};
    return await this.requests
      .getTransactionFromMempool({
        transactionId: transactionId
      })
      .then(function(result) {
        obj = result;
        return obj;
      })
      .catch(function(err) {
        console.error(err);
        obj.error = err.message;
        return obj;
      });
  }

  async getTransactionFromBlock(transactionId) {
    let obj = {};
    return await this.requests
      .getTransactionById({
        transactionId: transactionId
      })
      .then(function(result) {
        obj.transaction = result;
        return obj;
      })
      .catch(function(err) {
        console.error(err);
        obj.error = err.message;
        return obj;
      });
  }

  async getBlock(blockNumber) {
    let obj = {};
    if (isNaN(blockNumber)) {
      obj.error = `'${blockNumber} is an invalid block number`;
      return obj;
    }
    return await this.requests
      .getBlockByHeight({
        height: parseInt(blockNumber)
      })
      .then(function(result) {
        obj = result;
        return obj;
      })
      .catch(err => {
        //console.log('getBlock error:', err.message);
        obj.error = err.message;
        return obj;
      });
  }

  async sendRawPolyTransaction(txObject) {
    let obj = {};
    const self = this;
    return await this.verifyData(txObject)
      .then(function(result) {
        return self.requests.createRawPolyTransfer(result.params);
      })
      .then(function(result) {
        return result;
      })
      .catch(function(err) {
        obj.error = err.message;
        return obj;
      });
  }

  async polyTransaction(txObject) {
    let obj = {};
    let self = this;
    return await this.verifyData(txObject)
      .then(function(result) {
        return self.brambljs
          .transaction("createRawPolyTransfer", result.params)
          .then(function(result) {
            return result;
          })
          .catch(function(err) {
            //console.log("transaction error", err.message);
            obj.error = err.message;
            return obj;
          });
      })
      .catch(function(err) {
        //console.log('invalid transaction body', err.messsage);
        obj.error = err.message;
        return obj;
      });
  }

  createAssetValue(shortName) {
    return this.brambljs.createAssetCode(shortName);
  }

  appendMetadata(recipients, metadata) {
    const newRecipients = recipients;
    if (Array.isArray(recipients)) {
      for (var i = 0; i < recipients.length; i++) {
        // TODO: Implment Security Root Reference to Asset Box
        recipients[i].push(Constants.SAMPLE_SECURITY_ROOT);
        recipients[i].push(metadata);
      }
    }
    return newRecipients;
  }

  async assetTransaction(txObject) {
    let obj = {};
    let self = this;
    return await this.verifyData(txObject)
      .then(function(result) {
        result.params.minting = txObject.minting;
        result.params.assetCode = txObject.assetCode;
        result.params.recipients = self.appendMetadata(
          result.params.recipients,
          txObject.metadata
        );
        return self.brambljs
          .transaction("createRawAssetTransfer", result.params)
          .then(function(result) {
            return result;
          })
          .catch(function(err) {
            console.error("asset transaction error", err);
            obj.error = err.message;
            return obj;
          });
      })
      .catch(function(err) {
        //console.log('invalid transaction body', err.message);
        obj.error = err.message;
        return obj;
      });
  }

  async verifyData(txObject) {
    let obj = {};
    var networkPrefix = txObject.network;
    return new Promise((resolve, reject) => {
      // check that all recipients have a valid number of Topl assets
      if (Array.isArray(txObject.recipients)) {
        for (var i = 0; i < txObject.recipients.length; i++) {
          if (isNaN(txObject.recipients[i][1])) {
            reject(
              new Error(`value addressed to recipient is not a valid number`)
            );
          }
        }
      } else {
        reject(new Error(`recipients is not an array of [String, String]`));
      }

      const getCurrentFees = () => {
        let fees = {
          valhalla: 100,
          toplnet: 1000000000,
          local: 0,
          private: 100
        };
        return fees;
      };

      let fees = getCurrentFees();
      // set transaction object
      let params = {
        propositionType: txObject.propositionType,
        recipients: txObject.recipients,
        fee: fees[networkPrefix],
        sender: [txObject.sender],
        changeAddress: txObject.changeAddress,
        consolidationAddress: txObject.consolidationAddress,
        data: txObject.data
      };

      obj.fee = fees[networkPrefix];
      obj.params = params;
      resolve(obj);
    });
  }
}

module.exports = BramblHelper;
