const connections = require(`./db/connections`);
const networkUrl = connections.networkUrl;
const apiKey = connections.networkApiKey;
const BramblJS = require("brambljs");
const { flatten } = require("../util/extensions");

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
    const self = this;
    return new Promise(resolve => {
      const a = self.brambljs.keyManager.address;
      const kf = self.brambljs.keyManager.getKeyStorage();

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
  async getBalanceWithRequests(address) {
    let obj = {};
    let self = this;
    let e = await this.requests
      .lookupBalancesByAddresses({
        addresses: [address]
      })
      .then(function(result) {
        try {
          return self.generateBoxes(obj, result, address);
        } catch (err) {
          console.error(err);
          obj.error = err.message;
          return obj;
        }
      })
      .catch(function(err) {
        return (obj.error = err.message);
      });
    return e;
  }

  generateBoxes(obj, result, address) {
    obj.polyBalance = result.result[address].Balances.Polys;
    obj.arbitsBalance = result.result[address].Balances.Arbits;
    obj.boxes = [];
    obj.boxes = result.result[address].Boxes.PolyBox
      ? result.result[address].Boxes.PolyBox
      : [];
    obj.boxes = result.result[address].Boxes.ArbitBox
      ? obj.boxes.concat(result.result[address].Boxes.ArbitBox)
      : obj.boxes;
    obj.boxes = result.result[address].Boxes.AssetBox
      ? obj.boxes.concat(result.result[address].Boxes.AssetBox)
      : obj.boxes;
    return obj;
  }

  /**
   * Get Poly and Arbit balances for a valid address
   * @param {string} address
   * @return {Promise} Promise obj with data or error
   */
  async getBalanceWithBrambl(address) {
    let obj = {};
    let self = this;
    return this.brambljs.requests
      .lookupBalancesByAddresses({
        addresses: [address]
      })
      .then(function(result) {
        return self.generateBoxes(obj, result, address);
      })
      .catch(function(err) {
        console.error(err);
        obj.error = err.message;
        return obj;
      });
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
    var formattedRecipients = [];
    const self = this;
    obj.keys = self.getSenderKeyManagers(
      txObject.sender,
      txObject.senderPasswords,
      txObject.network
    );
    txObject.recipients.forEach(address => {
      const recipientForBramblJS = [address[0], address[1].quantity];
      formattedRecipients.push(recipientForBramblJS);
    });

    const params = {
      propositionType: txObject.propositionType,
      recipients: formattedRecipients,
      fee: txObject.fee,
      sender: txObject.sender,
      changeAddress: txObject.changeAddress
    };

    return self.brambljs.requests
      .createRawPolyTransfer(params)
      .then(function(result) {
        obj.messageToSign = result;
        return obj;
      })
      .catch(function(err) {
        obj.error = err.message;
        return obj;
      });
  }

  /**
   * Get Poly, Asset, and Arbit boxes for a valid set of addresses
   * @param {String[]} addresses: List of addresses
   * @return {Promise} Promise obj with data or error
   */
  async getBoxesWithBrambl(addresses) {
    let data = {};
    return this.brambljs.requests
      .lookupBalancesByAddresses({
        addresses: addresses
      })
      .catch(function(error) {
        data.error = error.message;
        return data;
      });
  }

  /**
   * Get Poly, Asset, and Arbit boxes for a valid set of addresses
   * @param {String[]} addresses: List of addresses
   * @return {Promise} Promise obj with data or error
   */
  async getBoxesWithRequests(addresses) {
    let data = {};
    return this.requests
      .lookupBalancesByAddresses({
        addresses: addresses
      })
      .catch(function(error) {
        data.error = error.message;
        return data;
      });
  }

  returnAssetBoxWithAssetCode(assetBoxes, assetCode) {
    var result = [];
    for (var i = 0; i < assetBoxes.length; i++) {
      if (assetBoxes[i].value.hasOwnProperty("assetCode")) {
        if (assetBoxes[i].value.assetCode === assetCode) {
          assetBoxes.push(assetBoxes[i].value);
        }
      }
    }
    return result;
  }

  async checkPolyBalances(senders, fee) {
    let obj = {};
    obj.polyBalance = senders
      .map(s => {
        if (this.brambljs) {
          this.getBalanceWithBrambl(s);
        } else {
          this.getBalanceWithRequests(s);
        }
      })
      .reduce((a, b) => a + b, 0);

    if (obj.polyBalance < fee) {
      obj.error = "Insufficient funds available to pay transaction fee.";
    }

    return obj;
  }

  /**
   * Gets the raw transaction object on the asset transaction you plan on signing before sending.
   * Allows verification of the asset transaction is correct as well as providing the message to sign
   * @param {Object} txObject is the req.body from the service that has passed validation
   * @return {Object} is the completed object that contains data about poly transactions and the message to sign.
   */
  async sendRawAssetTransaction(txObject) {
    let obj = {};
    const formattedRecipients = [];
    const self = this;
    obj.keys = self.getSenderKeyManagers(
      txObject.sender,
      txObject.senderPasswords,
      txObject.network
    );
    txObject.recipients.forEach(address => {
      const recipientForBramblJS = [
        address[0],
        address[1].quantity,
        address[1].securityRoot,
        address[1].metadata
      ];
      formattedRecipients.push(recipientForBramblJS);
    });
    const temp = txObject.recipients;
    txObject.recipients = formattedRecipients;
    return self.brambljs.requests
      .createRawAssetTransfer(txObject)
      .then(function(result) {
        txObject.recipients = temp;
        obj.messageToSign = result;
        return obj;
      })
      .catch(function(err) {
        console.error(err);
        txObject.recipients = temp;
        obj.err = err.message;
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
          console.error(err);
          obj.error = err.message;
          reject(err);
        });
      return e;
    });
  }

  createAssetValue(shortName) {
    return this.brambljs.createAssetCode(shortName);
  }

  getSenderKeyManagers(senders, sendersPasswords, networkPrefix) {
    let keyManagers = [];
    if (Array.isArray(senders)) {
      for (var i = 0; i < senders.length; i++) {
        keyManagers.push(
          BramblJS.KeyManager({
            networkPrefix: networkPrefix,
            password: sendersPasswords[i],
            keyPath: `private_keyfiles/${senders[i]}.json`
          })
        );
      }
    }
    return keyManagers;
  }

  async verifyRawTransactionData(txObject) {
    return new Promise(resolve => {
      // set transaction object
      let params = {
        propositionType: txObject.propositionType,
        recipients: txObject.recipients,
        fee: txObject.fee,
        sender: txObject.sender.map(function(item) {
          return item[0];
        }),
        senderPasswords: txObject.sender.map(function(item) {
          return item[1];
        }),
        changeAddress: txObject.changeAddress,
        data: txObject.data,
        consolidationAddress: txObject.consolidationAddress,
        minting: txObject.minting,
        assetCode: txObject.assetCode ? txObject.assetCode : null,
        network: txObject.network
      };
      resolve(params);
    });
  }
}

module.exports = BramblHelper;
