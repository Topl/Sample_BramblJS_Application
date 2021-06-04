/**
 * Create, import, and export Topl Bifrost keys.
 * Also allows for signing of transactions.
 *
 * @author James Aman (j.aman@topl.me)
 * @author Raul Aragonez (r.aragonez@topl.me)
 *
 * @namespace KeyManager
 */

// Initial implementation of this lib isBased on the keythereum library from Jack Peterson https://github.com/Ethereumjs/keythereum
"use strict";

// Dependencies
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const curve25519 = require("curve25519-js");
const {create, dump, recover, str2buf, generateKeystoreFilename} = require("../utils/key-utils.js");

// utils
const utils = require("../utils/address-utils.js");

// Default options for key generation as of 2021.02.04
const defaultOptions = {
  // Symmetric cipher for private key encryption
  cipher: "aes-256-ctr",

  // Initialization vector size in bytes
  ivBytes: 16,

  // Private key size in bytes
  keyBytes: 32,

  // Key derivation function parameters
  scrypt: {
    dkLen: 32,
    n: Math.pow(2, 18), // cost (as given in bifrost)
    r: 8, // blocksize
    p: 1 // parallelization
  },

  // networkPrefix
  networkPrefix: "private"
};

/* -------------------------------------------------------------------------- */
/*                           Key Manager Class                                */
/* -------------------------------------------------------------------------- */
/**
 * @class KeyManager
 * @memberof KeyManager
 * @classdesc Create a new instance of the Key management interface.
 */
class KeyManager {
    // Private variables
    #sk;
    #isLocked;
    #password;
    #keyStorage;
    #pk;
    #networkPrefix;
    #address;

    /* ------------------------------ Instance constructor ------------------------------ */
    /**
     * @constructor
     * @param {object} params constructor object for key manager or as a string password
     * @param {string} [params.password] password for encrypting (decrypting) the keyfile
     * @param {string} [params.keyPath] path to import keyfile
     * @param {object} [params.keyPair] encrypted keypair javascript object.
     * @param {object} [params.constants] default encryption options for storing keyfiles
     * @param {string} [params.networkPrefix] Network Prefix, defaults to "private"
     */
    constructor(params) {
      // enforce that a password must be provided
      if (!params || (params.constructor !== String && !params.password)) throw new Error("A password must be provided at initialization");

      /**
       * Initializes a key manager object with a key storage object
       *
       * @param {object} keyStorage - The keyStorage object that the keyManager will use to store the keys for a particular address.
       * @param {string} password for encrypting (decrypting) the keyfile
       * @returns {object} Returns the key storage used in the keyManager
       */
      const initKeyStorage = (keyStorage, password) => {
        this.#isLocked = false;
        this.#setKeyStorage(keyStorage, password);
      };

      /**
       * Imports the keyfile data object
       * @param {object} keyStorage: The JS object representing the encrypted keyfile
       * @param {object} password: The password to unlock the keyfile
       * @returns {object} returns the keyStorage used in the KeyManager
       */
      const importKeyPair = (keyStorage, password) => {
        // check if address is valid and has a valid network
        if (keyStorage.address) {
          // determine prefix and set networkPrefix
          const prefixResult = utils.getAddressNetwork(keyStorage.address);
          if (prefixResult.success) {
            this.#networkPrefix = prefixResult.networkPrefix;
          } else {
            throw new Error(prefixResult.error);
          }

          // validate address
          const validationResult = utils.validateAddressesByNetwork(this.networkPrefix, keyStorage.address);
          if (!validationResult.success) {
            throw new Error("Invalid Addresses::" +
                  " Network Type: <" + this.networkPrefix + ">" +
                  " Invalid Addresses: <" + validationResult.invalidAddresses + ">" +
                  " Invalid Checksums: <" + validationResult.invalidChecksums + ">");
          }

          this.#setKeyStorage(keyStorage, password);
        } else {
          throw new Error("No address found in key");
        }
      };

      /**
       * Imports key data object from keystore JSON file.
       * @param {string} filepath the filepath of the keystore JSON
       * @param {string} password the password for encrypting/decrypting * the keyfile
       * @returns {object} returns the keyStorage used in the KeyManager
       */
      const importFromFile = (filepath, password) => {
        const keyStorage = JSON.parse(fs.readFileSync(filepath));
        return importKeyPair(keyStorage, password);
      };

      /**
       * Generates a new curve25519 key pair and dumps them to an encrypted format
       * @param {string} password password for encrypting (decrypting) the keyfile
       * @returns {undefined} no obj returned
       */
      const generateKey = (password) => {
        // this will create a new curve25519 key pair and dump to an encrypted format
        initKeyStorage(dump(password, create(this.constants), this.constants), password);
      };

      // initialize variables
      this.constants = params.constants || defaultOptions;

      // set networkPrefix and validate
      this.#networkPrefix = params.networkPrefix || "private";

      // ensure constant include this.#networkPrefix for key creation
      this.constants.networkPrefix = this.#networkPrefix;

      if (this.#networkPrefix !== "private" && !utils.isValidNetwork(this.#networkPrefix)) {
        throw new Error(`Invalid Network Prefix. Must be one of: ${utils.getValidNetworksList()}`);
      }

      initKeyStorage({address: "", crypto: {}}, "");

      // load in keyfile if a path or object was given, otherwise default to generating a new keypair.
      if (params.keyPath) {
        try {
          importFromFile(params.keyPath, params.password);
        } catch (err) {
          throw new Error("Error importing keyfile - " + err);
        }
      } else if (params.keyPair) {
        try {
          importKeyPair(params.keyPair, params.password);
        } catch (err) {
          throw new Error("Error importing keyPair - " + err);
        }
      } else {
        // Will check if only a string was given and assume it is the password
        if (params.constructor === String) generateKey(params);
        else generateKey(params.password);
      }
    }

    /* ------------------------------ Static methods ------------------------------------ */

    /**
     * Check whether a private key was used to generate the signature for a message.
     * This method is static so that it may be used without generating a keyfile
     * @function Verify
     * @memberof KeyManager
     * @static
     * @param {Buffer|string} publicKey A public key (if string, must be bs58 encoded)
     * @param {string} message Message to sign (utf-8 encoded)
     * @param {Buffer|string} signature Signature to verify (if string, must be bs58 encoded)
     * @returns {function} returns function Verify
     * @memberof KeyManager
     */
    static verify(publicKey, message, signature) {
      const pk = str2buf(publicKey);
      const msg = str2buf(message, "base58");
      const sig = str2buf(signature);

      return curve25519.verify(pk, msg, sig);
    };

    /**
     * Static wrapper of importing the key pair via a constructor. Generates a new instance of a keyManager with the imported keypair and password.
     * @param {object} keyStorage: The JS object representing the encrypted keyfile
     * @param {string} password: The password to unlock the keyfile
     * @returns {object} returns the keyStorage used in the KeyManager
     */
    static importKeyPair(keyStorage, password) {
      return new KeyManager({
        password: password,
        keyPair: keyStorage
      });
    }

    /**
     * Static wrapper of importing the key pair from file via the constructor. Generates a new instance of a keyManager with the imported keypair and password.
     * @param {string} keyFilePath: The JS object representing the encrypted keyfile
     * @param {string} password: The password to unlock the keyfile
     * @returns {object} returns the keyStorage used in the KeyManager
     */
    static importKeyPairFromFile(keyFilePath, password) {
      return new KeyManager({
        password: password,
        keyPath: keyFilePath
      });
    }

    /**
     * Setter function to input keyStorage in the Bifrost compatible format
     * @param {object} keyStorage - The keyStorage object that the keyManager will use to store the keys for a particular address.
     * @param {string} password for encrypting (decrypting) the keyfile
     * @function setKeyStorage
     * @memberof KeyManager
     * @returns {object};
     */
    #setKeyStorage(keyStorage, password) {
      if (this.#isLocked) throw new Error("Key manager is currently locked. Please unlock and try again.");
      this.#address = keyStorage.address;
      this.#password = password;
      this.#keyStorage = keyStorage;
      if (this.#address) {
        [this.#sk, this.#pk] = recover(password, keyStorage, this.constants.scrypt);
      }
    }

    /* ------------------------------ Public methods -------------------------------- */

    /**
     * Getter function to retrieve key storage in the Bifrost compatible format
     * @function GetKeyStorage
     * @memberof KeyManager
     * @returns {object} returns value of private var keyStorage
     */
    getKeyStorage() {
      if (this.#isLocked) throw new Error("Key manager is currently locked. Please unlock and try again.");
      if (!this.#pk) throw new Error("A key must be initialized before using this key manager");
      return this.#keyStorage;
    }

    /**
     * Set the key manager to locked so that the private key may not be decrypted
     * @memberof KeyManager
     * @returns {void}
     */
    lockKey() {
      this.#isLocked = true;
    }

    /**
     * Getter for private property #isLocked
     * @memberof KeyManager
     * @returns {boolean} value of #isLocked
     */
    get isLocked() {
      return this.#isLocked;
    }

    /**
     * Setter for private property #isLocked
     * @memberof KeyManager
     * @param {any} args ignored, only necessary for setter
     * @returns {void} Error is thrown to protect private variable
     */
    set isLocked(args) {
      throw new Error("Invalid private variable access, use lockKey() instead.");
    }

    /**
     * Getter for private property #pk
     * @memberof KeyManager
     * @returns {string} value of #pk (public key string)
     */
    get pk() {
      return this.#pk;
    }

    /**
     * Setter for private property #pk
     * @memberof KeyManager
     * @param {any} args ignored, only necessary for setter
     * @returns {void} Error is thrown to protect private variable
     */
    set pk(args) {
      throw new Error("Invalid private variable access, instantiate a new KeyManager instead.");
    }

    /**
     * Getter for private property #address
     * @memberof KeyManager
     * @param {any} args ignored, only necessary for setter
     * @returns {void} Error is thrown to protect private variable
     */
    get address() {
      return this.#address;
    }

    /**
     * Setter for private property #address
     * @memberof KeyManager
     * @param {any} args ignored, only necessary for setter
     * @returns {void} Error is thrown to protect private variable
     */
    set address(args) {
      throw new Error("Invalid private variable access, instantiate a new KeyManager instead.");
    }

    /**
     * Getter for private property #networkPrefix
     * @memberof KeyManager
     * @returns {string} value of #networkPrefix
     */
    get networkPrefix() {
      return this.#networkPrefix;
    }

    /**
     * Setter for private property #isLocked
     * @memberof KeyManager
     * @param {any} args ignored, only necessary for setter
     * @returns {void} Error is thrown to protect private variable
     */
    set networkPrefix(args) {
      throw new Error("Invalid private variable access.");
    }

    /**
     * Unlock the key manager to be used in transactions
     * @param {string} password encryption password for accessing the keystorage object
     * @memberof KeyManager
     * @returns {void}
     */
    unlockKey(password) {
      if (!this.#isLocked) throw new Error("The key is already unlocked");
      if (password !== this.#password) throw new Error("Invalid password");
      this.#isLocked = false;
    }

    /**
     * Generate the signature of a message using the provided private key
     * @param {string} message Message to sign (utf-8 encoded)
     * @memberof KeyManager
     * @returns {Uint8Array} signature
     */
    sign(message) {
      if (this.#isLocked) throw new Error("The key is currently locked. Please unlock and try again.");
      if (!this.#sk) throw new Error("A key must be initialized before using this key manager");
      if (!message || message.constructor !== String) throw new Error("Invalid message provided as argument.");

      return curve25519.sign(str2buf(this.#sk), str2buf(message, "base58"), crypto.randomBytes(64));
    }

    /**
     * Export formatted JSON to keystore file.
     * @param {string=} _keyPath Path to keystore folder (default: ".keyfiles")
     * @returns {string} JSON filename
     * @memberof KeyManager
     */
    exportToFile(_keyPath) {
      if (this.#isLocked) throw new Error("The key is currently locked. Please unlock and try again.");
      if (!this.#pk) throw new Error("A key must be initialized before using this key manager");
      if (_keyPath && _keyPath.constructor !== String) throw new Error("Invalid keypath provided as argument.");

      const keyPath = _keyPath || ".keyfiles";
      const outfile = generateKeystoreFilename(this.#pk);
      const json = JSON.stringify(this.getKeyStorage());
      const outpath = path.join(keyPath, outfile);

      // write file and return outpath if successful or throw error
      try {
        // create default directory if it doesn't exist
        if (keyPath === ".keyfiles" && !fs.existsSync(keyPath)) {
          fs.mkdirSync(keyPath);
        }
        // write file
        fs.writeFileSync(outpath, json);
      } catch (error) {
        throw new Error("Error exporting to file." + error);
      }

      return outpath;
    }
};

/* -------------------------------------------------------------------------- */

module.exports = KeyManager;

/* -------------------------------------------------------------------------- */
