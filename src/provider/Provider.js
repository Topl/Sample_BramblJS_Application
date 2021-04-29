const EventEmitter = require ("events");
const {_getInitializedNetworks} = require("./providers/index")
const BN = require('bn.js')

class Provider extends EventEmitter {

  constructor(opts) {
    super()
    this._customProviders = opts.customProviders ?? []
    this._networkParams
  }

  static forCustomProvider(baseProvider, customProviderParams) {
    const standardProviderParams = Provider._getProviderParams(baseProvider)

    return new Provider({
      chain: {
        ...standardProviderParams,
        ...customProviderParams,
      }
    })
  }

  private static _getProviderParams(provider, customProvider) {
    const initializedNetworks = _getInitializedNetworks(customProvider)
    if (initializedNetworks['names'][provider]) {
      const name = initializedNetworks['names'][provider]
      return initializedNetworks[name]
    }

    throw new Error(`Network with ID ${provider} not supported`)
  }

  setProvider(provider) {
    if (this._customProviders.length > 0) {
      throw new Error("Please initialize using the custom provider method")
    }
    const required = 'networkId'
    if ((provider)[required] === undefined) {
      throw new Error(`Missing required provider parameter: ${required}`)
    }
    this._providerParams = provider;
    return this._providerParams;
  }

  setProviderById(provider) {
    this._providerParams = Provider._getProviderParams(provider, this._customProviders);
    return this._providerParams;
  }

  url() {
    return this._providerParams['baseUrl']
  }

  /**
   * Returns the Fee for the current provider
   * @returns provider fee
   */
  feeBN() {
    return new BN(this._providerParams['nanopolyFee'])
  }

/**
 * Returns the ID of current provider
 * @returns provider Id
 */
  providerIdBN(){
    return new BN(this._providerParams['providerId'])
  }
/**
 * Returns the name of current provider
 * @returns provider name (lower case)
 */
  providerName(){
    return this._providerParams['name']
  }

  /**
   * Returns the Id of current network
   * @returns networkId
   */
  networkIdBN(){
    return new BN(this._providerParams['networkId'])
  }

  /**
   * Returns the consensus type of the network
   * Currently we only support POS
   */
  consensusType(){
    return this._providerParams['consensus']['type']
  }

  /**
   * Returns the concrete consensus imlementation algorithm for the network e.g NXT or Ouroboros
   */
  consensusAlgorithm(){
    return this._providerParams['consensus']['algorithm']
  }

  /**
   * Returns a deep copy of this Provider instance
   */
  copy() {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this)
  }

}

module.exports = Provider;
