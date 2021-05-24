const buffer = require("buffer");
const _ = require("lodash");
class StringOps {
  /**
   * Return the byte buffer of a string after ensuring valid encoding.
   * @param {String} inString JavaScript String
   * @param {String} charset Charset into which to encode the string.
   */
  static getValidBytes(inString, charset) {
    try {
      return buffer.transcode(Buffer.from(inString), "utf16le", charset);
    } catch (error) {
      console.error(error);
      return;
    }
  }

  /**
   * Returns the byte buffer of a string after ensuring latin-1 encoding
   * @param {String} s: String to encode in Latin1
   */
  static getValidLatin1Bytes(s) {
    return this.getValidBytes(s, "latin1");
  }

  static getValidUTFBytes(s) {
    return this.getValidBytes(s, "utf8");
  }
}

async function asyncFlatMap(arr, asyncFn) {
  return Promise.all(flatten(await asyncMap(arr, asyncFn)));
}

function asyncMap(arr, asyncFn) {
  return Promise.all(arr.map(asyncFn));
}

function flatMap(arr, fn) {
  return flatten(arr.map(fn));
}

function flatten(arr) {
  return [].concat(...arr);
}

/*
 * Compare two objects by reducing an array of keys in obj1, having the
 * keys in obj2 as the intial value of the result. Key points:
 *
 * - All keys of obj2 are initially in the result.
 *
 * - If the loop finds a key (from obj1, remember) not in obj2, it adds
 *   it to the result.
 *
 * - If the loop finds a key that are both in obj1 and obj2, it compares
 *   the value. If it's the same value, the key is removed from the result.
 */
function getObjectDiff(obj1, obj2) {
  const diff = Object.keys(obj1).reduce((result, key) => {
    if (!obj2.hasOwnProperty(key)) {
      result.push(key);
    } else if (_.isEqual(obj1[key], obj2[key])) {
      const resultKeyIndex = result.indexOf(key);
      result.splice(resultKeyIndex, 1);
    }
    return result;
  }, Object.keys(obj2));

  return diff;
}

module.exports = {
  asyncFlatMap,
  asyncMap,
  flatMap,
  flatten,
  getObjectDiff,
  StringOps
};
