const connections = require(`./connections`);
const networkUrl = connections.networkUrl;
const apiKey = connections.networkApiKey;
const BramblJS = require("brambljs");
const Constants = require("../util/constants");
const e = require("express");

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

  /**
   * Get Poly and Arbit balances for a valid address
   * @param {string} address
   * @return {Promise} Promise obj with data or error
   */
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

  /**
   * Get latest block
   * @return {(Promise| Object)}
   */
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

  /**
   * Get transaction details from the mempool
   * @param {string} transactionId id for transaction
   * @return {(Promise|Object)}
   */
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

  /**
   * Get transaction details from the block
   * @param {string} transactionId id for transaction
   * @return {(Promise|Object)}
   */
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

  /**
   * Get the block data for provided block number
   * @param {number} blockNumber is the block number
   * @return {(Promise|Object)} either error or block data
   */
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

  /**
   * Gets the raw transaction object on the poly transaction you plan on signing before sending.
   * Allows verification of the poly transaction is correct as well as providing the message to sign
   * @param {Object} txObject is the req.body from the service that has passed validation
   * @return {Object} is the completed object that contains data about the poly transaction and the message to sign
   */
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

  /**
   * Gets the raw transaction object on the asset transaction you plan on signing before sending.
   * Allows verification of the asset transaction is correct as well as pproviding the message to sign
   * @param {Object} txObject is the req.body from the service that has passed validation
   * @return {Object} is the completed object that contains data about poly transactions and the message to sign.
   */
  async sendRawAssetTransaction(txObject) {
    let obj = {};
    const self = this;
    return await this.verifyData(txObject)
      .then(function(result) {
        result.params.minting = txObject.minting;
        result.params.assetCode = txObject.assetCode;
        result.params.recipients = self.appendMetadata(
          result.params.recipients,
          txObject.metadata
        );
        return self.brambljs.createRawPolyTransfer(result.params);
      })
      .catch(function(err) {
        obj.error = err.message;
        return obj;
      });
  }
  /**
   * Sign transaction with tx object and private key
   * @param {Object} txObject is the transaction object
   * @return {(Promise|Object)} signed object with rawTransaction data to be uused for sending transaction
   */
  async signTransaction(txObject) {
    let obj = {};
    let self = this;
    const e = await this.verifyData(txObject)
      .then(function(result) {
        return self.brambljs
          .addSigToTx(result.paramsToSign, result.keys)
          .catch(function(err) {
            //console.log('signing error', err.message);
            obj.error = err.message;
            return obj;
          });
      })
      .catch(function(err) {
        // console.log('tx formatting error', err.message)
        obj.error = err.message;
        return obj;
      });
    return e;
  }

  async sendSignedTransaction(signedTransactionData) {
    let obj = {};
    let self = this;
    return new Promise((resolve, reject) => {
      let e = self.brambljs.requests
        .broadcastTx({ tx: signedTransactionData })
        .then(function(result) {
          //console.log("sent transaction")
          obj.txId = result.data.result.txId;
          resolve(obj);
        })
        .catch(function(err) {
          //console.log('sent error', error.message);
          obj.error = err.message;
          reject(err);
        });
      return e;
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
        newRecipients[i].push(Constants.SAMPLE_SECURITY_ROOT);
        newRecipients[i].push(metadata);
      }
    }
    return newRecipients;
  }

  getSenderKeyManagers(senders) {
    let keyManagers = [];
    if (Array.isArray(senders)) {
      for (var i = 0; i < senders.length; i++) {
        keyManagers.push(
          new BramblJS.KeyManager({
            password: senders[i].password,
            keyPath: senders[i].address
          })
        );
      }
    }
    return keyManagers;
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
