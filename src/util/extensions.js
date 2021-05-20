const buffer = require("buffer");
class StringOps {
  /**
   * Return the byte buffer of a string after ensuring valid encoding.
   * @param {String} inString JavaScript String
   * @param {String} charset Charset into which to encode the string.
   */
  static getValidBytes(inString, charset) {
    try {
      return buffer.transcode(Buffer.from(inString), "utf16", charset);
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
    return this.getValidBytes(s, "ISO-8859-1");
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

module.exports = {
  asyncFlatMap,
  asyncMap,
  flatMap,
  flatten,
  StringOps
};
