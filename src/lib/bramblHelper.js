const connections = require(`./connections`);
const networkUrl = connections.networkUrl;
const apiKey = connections.networkApiKey;
const BramblJS = require("brambljs");

class BramblHelper {
  constructor(password, network, keyfilePath) {
    // parameter was omitted in call
    if (keyfilePath === undefined) {
      this.constructWithoutKeyfilePath(password, network);
    } else {
      this.constructWithKeyfilePath(password, network, keyfilePath);
    }
  }

  constructWithKeyfilePath(password, network, keyfilePath) {
    // Initialize BramblJS and set request body to url provided in the configuration
    // Also load the keyfile via the path provided in the request
    const bramblJsRequests = {
      url: `${networkUrl}`,
      apiKey: `${apiKey}`
    };
    var keyManager;
    try {
      keyManager = BramblJS.KeyManager({
        password: password,
        keyPath: `private_keyfiles/${keyfilePath}`
      });
    } catch (e) {
      //console.log("Missing or Invalid Keyfile");
      return null;
    }

    this.brambljs = new BramblJS({
      password: password,
      networkPrefix: network,
      Requests: bramblJsRequests,
      KeyManager: keyManager
    });
  }

  constructWithoutKeyfilePath(password, network) {
    const bramblJsRequests = {
      url: `${networkUrl}`,
      apiKey: `${apiKey}`
    };

    this.brambljs = new BramblJS({
      networkPrefix: network,
      Requests: bramblJsRequests,
      password: password
    });
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
    let e = await this.brambljs.requests
      .lookupBalancesByAddresses({ addresses: [address] })
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
    let e = await this.brambljs.requests
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
    return await this.brambljs.requests
      .getTransactionFromMempool({ transactionId: transactionId })
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
    return await this.brambljs.requests
      .getTransactionById({ transactionId: transactionId })
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
    return await this.brambljs.requests
      .getBlockByHeight({ height: parseInt(blockNumber) })
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
    var self = this;
    return await this.processPolyTransactionInfoData(txObject)
      .then(function(result) {
        return self.brambljs.requests.createRawPolyTransfer(result.params);
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
    return await this.processPolyTransactionInfoData(txObject)
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

  async processPolyTransactionInfoData(txObject) {
    let obj = {};
    var networkPrefix = this.brambljs.networkPrefix;
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
        sender: txObject.sender,
        changeAddress: txObject.changeAddress,
        data: txObject.data
      };

      obj.fee = fees[networkPrefix];
      obj.params = params;
      resolve(obj);
    });
  }
}

module.exports = BramblHelper;
