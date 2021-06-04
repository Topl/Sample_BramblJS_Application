/**
 * @fileOverview Utility encryption related functions for KeyManager module.
 *
 * @author James Aman (j.aman@topl.me)
 * @author Raul Aragonez (r.aragonez@topl.me)
 *
 * @exports KeyUtils create, dump, recover, str2buf, generateKeystoreFilename
 */

"use strict";

// Dependencies
const blake = require("blake2");
const crypto = require("crypto");
const Base58 = require("bs58");
const curve25519 = require("curve25519-js");

const utils = require("./address-utils.js");

/* ------------------------------ Generic key utils  ------------------------------ */

/**
 * Convert a string to a Buffer with optional Node builtin encoding specified.
 * If encoding is not specified, Base58 encoding will be assumed, if the input is valid.
 * @param {string} str String to be converted.
 * @param {string=} enc Encoding of the input string (optional).
 * @returns {Buffer} Buffer (bytearray) containing the input data.
 */
function str2buf(str, enc) {
  if (!str || str.constructor !== String) return str;
  else if (enc === "base58") return Buffer.from(Base58.decode(str));
  else return enc ? Buffer.from(str, enc) : Buffer.from(Base58.decode(str));
}

/**
 * Check if the selected cipher is available.
 * @param {string} cipher Encryption algorithm.
 * @returns {boolean} If available true, otherwise false.
 */
function isCipherAvailable(cipher) {
  return crypto.getCiphers().some(function(name) {
    return name === cipher;
  });
}

/**
 * Symmetric privateKey + secretKey encryption using secret (derived) key.
 * @param {Buffer|string} plaintext Data to be encrypted.
 * @param {Buffer|string} key Secret key.
 * @param {Buffer|string} iv Initialization vector.
 * @param {string=} algo Encryption algorithm (default: constants.cipher).
 * @returns {Buffer} Encrypted data.
 */
function encrypt(plaintext, key, iv, algo) {
  if (!isCipherAvailable(algo)) throw new Error(algo + " is not available");
  const cipher = crypto.createCipheriv(algo, str2buf(key), str2buf(iv));
  const ciphertext = cipher.update(str2buf(plaintext));

  return Buffer.concat([ciphertext, cipher.final()]);
}

/**
 * Symmetric privateKey + secretKey decryption using secret (derived) key.
 * @param {Buffer|string} ciphertext Data to be decrypted.
 * @param {Buffer|string} key derived key.
 * @param {Buffer|string} iv Initialization vector.
 * @param {string=} algo Encryption algorithm (default: constants.cipher).
 * @returns {Buffer} Decrypted data.
 */
function decrypt(ciphertext, key, iv, algo) {
  if (!isCipherAvailable(algo)) throw new Error(algo + " is not available");
  const decipher = crypto.createDecipheriv(algo, str2buf(key), str2buf(iv));
  const plaintext = decipher.update(str2buf(ciphertext));
  return Buffer.concat([plaintext, decipher.final()]);
}

/**
 * Calculate message authentication code from secret (derived) key and
 * encrypted text. The MAC is the keccak-256 hash of the byte array
 * formed by concatenating the second 16 bytes of the derived key with
 * the ciphertext key's contents.
 * @param {Buffer|string} derivedKey Secret key derived from password.
 * @param {Buffer|string} ciphertext Text encrypted with secret key.
 * @returns {string} Base58-encoded MAC.
 */
function getMAC(derivedKey, ciphertext) {
  const blake2b = (msg) => blake.createHash("blake2b", {digestLength: 32}).update(msg).digest();
  if (derivedKey !== undefined && derivedKey !== null && ciphertext !== undefined && ciphertext !== null) {
    return blake2b(Buffer.concat([
      str2buf(derivedKey).slice(16, 32),
      str2buf(ciphertext)
    ]));
  }
}

/**
 * Generate random numbers for private key, initialization vector,
 * and salt (for key derivation).
 * @param {Object} params Encryption options.
 * @param {string} params.keyBytes Private key size in bytes.
 * @param {string} params.ivBytes Initialization vector size in bytes.
 * @returns {Object} Keys, IV and salt.
 */
function create(params) {
  const keyBytes = params.keyBytes;
  const ivBytes = params.ivBytes;

  /**
   * Create hash using Blake2b
   * @param {Object} Buffer buffer to process
   * @returns {Object} has created by blake2b
   */
  function bifrostBlake2b(Buffer) {
    return blake.createHash("blake2b", {digestLength: 32}).update(Buffer).digest();
  }

  /**
   * Generate curve25519 Key
   * @param {Object} randomBytes random bytes
   * @returns {Object} curve25519 Key as obj
   */
  function curve25519KeyGen(randomBytes) {
    const {public: pk, private: sk} = curve25519.generateKeyPair(bifrostBlake2b(randomBytes));
    return {
      publicKey: Buffer.from(pk),
      privateKey: Buffer.from(sk),
      iv: bifrostBlake2b(crypto.randomBytes(keyBytes + ivBytes + keyBytes)).slice(0, ivBytes),
      salt: bifrostBlake2b(crypto.randomBytes(keyBytes + ivBytes))
    };
  }

  return curve25519KeyGen(crypto.randomBytes(keyBytes + ivBytes + keyBytes));
}

/**
 * Derive secret key from password with key derivation function.
 * @param {String|Buffer} password User-supplied password.
 * @param {String|Buffer} salt Randomly generated salt.
 * @param {Object} [kdfParams] key-derivation parameters
 * @returns {Buffer} Secret key derived from password.
 */
function deriveKey(password, salt, kdfParams) {
  if (typeof password === "undefined" || password === null || !salt) {
    throw new Error("Must provide password and salt to derive a key");
  }

  // convert strings to Buffers
  password = str2buf(password, "latin1");
  salt = str2buf(salt);

  // get scrypt parameters
  const dkLen = kdfParams.dkLen;
  const N = kdfParams.n;
  const r = kdfParams.r;
  const p = kdfParams.p;
  const maxmem = 2 * 128 * N * r;

  return crypto.scryptSync(password, salt, dkLen, {N, r, p, maxmem});
}

/**
 * Assemble key data object in secret-storage format.
 * @param {Buffer} derivedKey Password-derived secret key.
 * @param {Object} keyObject Object containing the raw public / private keypair
 * @param {Buffer} salt Randomly generated salt.
 * @param {Buffer} iv Initialization vector.
 * @param {Buffer} algo encryption algorithm to be used
 * @param {String} network network prefix as string i.e local/private/toplnet
 * @returns {Object} key data object in secret-storage format
 */
function marshal(derivedKey, keyObject, salt, iv, algo, network) {
  // for cipherText: encryption of public + private key
  const concatKeys = Buffer.concat([keyObject.privateKey, keyObject.publicKey], 64);

  // encrypt using last 16 bytes of derived key (this matches Bifrost)
  const ciphertext = encrypt(concatKeys, derivedKey, iv, algo);

  // generate address
  const createAddress = utils.generatePubKeyHashAddress(keyObject.publicKey, network);
  if (createAddress && !createAddress.success) {
    throw new Error(createAddress.errorMsg);
  }

  const keyStorage = {
    address: createAddress.address,
    crypto: {
      mac: Base58.encode(getMAC(derivedKey, ciphertext)),
      kdf: "scrypt",
      cipherText: Base58.encode(ciphertext),
      kdfSalt: Base58.encode(salt),
      cipher: algo,
      cipherParams: {iv: Base58.encode(iv)}
    }
  };

  return keyStorage;
}

/**
 * Export private key to keystore secret-storage format.
 * @param {string|Buffer} password User-supplied password.
 * @param {Object} keyObject Object containing the raw public / private keypair
 * @param {Buffer} options encryption algorithm to be used
 * @returns {Object} keyStorage for use with exportToFile
 */
function dump(password, keyObject, options) {
  const kdfParams = options.kdfParams || options.scrypt;
  const iv = str2buf(keyObject.iv);
  const salt = str2buf(keyObject.salt);
  const privateKey = str2buf(keyObject.privateKey);
  const publicKey = str2buf(keyObject.publicKey);

  return marshal(deriveKey(password, salt, kdfParams), {privateKey, publicKey}, salt, iv, options.cipher, options.networkPrefix);
}

/**
 * Recover plaintext private key from secret-storage key object.
 * @param {string|Buffer} password User-supplied password.
 * @param {Object} keyStorage Keystore object.
 * @param {Object} [kdfParams] key-derivation parameters
 * @returns {Buffer} Plaintext private key.
 */
function recover(password, keyStorage, kdfParams) {
  /**
   * Verify that message authentication codes match, then decrypt
   * @param {Buffer} derivedKey Password-derived secret key.
   * @param {Buffer} iv Initialization vector.
   * @param {Object} ciphertext cipher text
   * @param {Object} mac keccak-256 hash of the byte array
   * @param {Buffer} algo encryption algorithm to be used
   * @returns {object} returns result of fn decrypt
   */
  function verifyAndDecrypt(derivedKey, iv, ciphertext, mac, algo) {
    if (!getMAC(derivedKey, ciphertext).equals(mac)) {
      throw new Error("message authentication code mismatch");
    }
    return decrypt(ciphertext, derivedKey, iv, algo);
  }

  const iv = str2buf(keyStorage.crypto.cipherParams.iv);
  const salt = str2buf(keyStorage.crypto.kdfSalt);
  const ciphertext = str2buf(keyStorage.crypto.cipherText);
  const mac = str2buf(keyStorage.crypto.mac);
  const algo = keyStorage.crypto.cipher;

  return keysEncodedFormat(verifyAndDecrypt(deriveKey(password, salt, kdfParams), iv, ciphertext, mac, algo));
}

/**
 * Parse KeysBuffer and split into [secretKey, publicKey]
 * @param {Buffer} keysBuffer Buffer containing both keys
 * @returns {Array} Array with format [sk, pk]
 */
function keysEncodedFormat(keysBuffer) {
  if (keysBuffer.length !== 64) {
    throw new Error("Invalid keysBuffer.");
  }
  return [Base58.encode(keysBuffer.slice(0, 32)), Base58.encode(keysBuffer.slice(32))];
}

/**
 * Generate filename for a keystore file.
 * @param {String} publicKey Topl address.
 * @returns {string} Keystore filename.
 */
function generateKeystoreFilename(publicKey) {
  if (typeof publicKey !== "string") throw new Error("PublicKey must be given as a string for the filename");
  const filename = new Date().toISOString() + "-" + publicKey + ".json";

  return filename.split(":").join("-");
}

module.exports = {create, dump, recover, str2buf, generateKeystoreFilename};
