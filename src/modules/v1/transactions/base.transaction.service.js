/**
 * This will be the base class of the various tranasaction types that are possible on the Topl network.
 *
 * It is therefore not recommended to use directly
 */
const {MAX_INTEGER} = require("../../../lib/constants");
const AddressesService = require("../addresses/addresses.service")

class AssetTransactionService {

  /**
   * Instantiate a transaction from the raw transaction 
   * @param {object} txData The data received from the raw transaction
   * @param {object} opts transaction options 
   */
  static fromTxData(txData, opts) {
    return new AssetTransactionService(txData, opts);
  }

  static fromValuesArray(values, opts) {
    // Length must be > 6
     if (values.length !== 8) {
       throw new Error(
         "Invalid transaction. Only expecting 8 values"
       )
     }

     const [propositionType, recipients, sender, changeAddress, fee, txData, minting, signatures] = values

     return new AssetTransactionService({propositionType, recipients, sender, changeAddress, fee, txData, minting, signatures}, opts)

  }

  // TODO, instantiate from serialized TX

  /**
   * This constructor takes the values, validates them, and assigns them
   * 
   * It is not recommended to use this constructor directly, Instead, use the static factory methods to assist in creating a AssetTransactionService from varying data types
   * @param {object} data Required transaction data
   * @param {object} opts Transaction options
   */
  constructor(data, opts) {
    const {
      propositionType,
      recipients,
      sender,
      changeAddress,
      fee,
      txData,
      minting,
      signatures
    } = data;

    this._validateCannotExceedMaxInteger({ fee });

    this.provider = opts.common.copy() ?? new Provider({ provider: "toplnet" });

    const freeze = opts !== null ? opts.freeze : true
    if (freeze) {
      Object.freeze(this)
    }
  }

  _validateCannotExceedMaxInteger(values) {
    for (const [key, value] of Object.entries(values)) {
      if (value?.gt(MAX_INTEGER)) {
        throw new Error(`${key} cannot exceed MAX_INTEGER, given ${value}`);
      }
    }
  }

  _getMessageToSign() {
    const values = [
      
    ]
  }

  /**
   * Returns the transaction type
   */
  transactionType(){
    return this._type;
  }

  /**
   * Alias for `transactionType`
   */
  type() {
    return this.transactionType;
  }

  isSigned(){
    return !!this.signatures;
  }

  validate(stringError) {
    const errors = [];

    if (this.isSigned()){
      if (this.getBaseFee().gt(this.fee)) {
        errors.push(`fee is too low. given ${this.fee}, need at least ${this.getBaseFee()}`);
      }
    }

    return stringError ? errors : errors.length === 0;
    
  }

  getBaseFee() {
    return this.provider.feeBN();
  }


  /**
   * Returns the sender's address information from the DB
   */
  getSenderAddress() {
    return AddressesService.getAddressById(this.sender);
  }

  transaction(keyfile) {
    
  }


  }


}
