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
        return obj;
      })
      .catch(function(err) {
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
    return await this.verifyRawTransactionData(txObject)
      .then(function(result) {
        obj.keys = self.getSenderKeyManagers(
          txObject.senders,
          txObject.network
        );
        return self.brambljs.requests
          .createRawPolyTransfer(result.params)
          .then(function(result) {
            obj.messageToSign = result;
            return obj;
          });
      })
      .catch(function(err) {
        obj.error = err.message;
        return obj;
      });
  }

  /**
   * Gets the raw transaction object on the asset transaction you plan on signing before sending.
   * Allows verification of the asset transaction is correct as well as providing the message to sign
   * @param {Object} txObject is the req.body from the service that has passed validation
   * @return {Object} is the completed object that contains data about poly transactions and the message to sign.
   */
  async sendRawAssetTransaction(txObject) {
    let obj = {};
    const self = this;
    return await this.verifyRawTransactionData(txObject)
      .then(function(result) {
        obj.keys = self.getSenderKeyManagers(
          txObject.senders,
          txObject.network
        );
        result.params.minting = txObject.minting;
        result.params.assetCode = txObject.assetCode;
        result.params.recipients = self.appendMetadata(
          result.params.recipients
        );
        return self.brambljs.requests
          .createRawAssetTransfer(result.params)
          .then(function(result) {
            obj.messageToSign = result;
            return obj;
          });
      })
      .catch(function(err) {
        console.error(err);
        obj.error = err.message;
        return obj;
      });
  }

  async signAndSendTransaction(txObject) {
    let obj = {};
    let self = this;
    return this.signTransaction(txObject).then(function(value) {
      if (value.error) {
        obj.error = value.error;
        return obj;
      } else {
        return self.sendSignedTransaction(value).then(function(value) {
          if (value.error) {
            obj.error = value.error;
            return obj;
          } else {
            return value;
          }
        });
      }
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
    return await self.brambljs
      .addSigToTx(txObject.messageToSign.result, txObject.keys)
      .catch(function(err) {
        console.error(err);
        obj.error = err.message;
        return obj;
      });
  }

  async sendSignedTransaction(signedTransactionData) {
    let obj = {};
    let self = this;
    return new Promise((resolve, reject) => {
      let e = self.brambljs.requests
        .broadcastTx({ tx: signedTransactionData })
        .then(function(result) {
          obj.txId = result.result.txId;
          resolve(obj);
        })
        .catch(function(err) {
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

  getSenderKeyManagers(senders, networkPrefix) {
    let keyManagers = [];
    if (Array.isArray(senders)) {
      for (var i = 0; i < senders.length; i++) {
        keyManagers.push(
          BramblJS.KeyManager({
            networkPrefix: networkPrefix,
            password: senders[i][1],
            keyPath: `private_keyfiles/${senders[i][0]}.json`
          })
        );
      }
    }
    return keyManagers;
  }

  async verifyRawTransactionData(txObject) {
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
        sender: txObject.senders.map(function(item) {
          return item[0];
        }),
        changeAddress: txObject.changeAddress,
        data: txObject.data,
        consolidationAddress: txObject.consolidationAddress
      };
      obj.fee = fees[networkPrefix];
      obj.params = params;
      resolve(obj);
    });
  }
}

module.exports = BramblHelper;
