var BN = require("bn.js"); // handles topl balances

BramblUtils = {
  /**
   * Returns true if object is BN, otherwise false
   * @method isBN
   * @param {Object} object
   * @return {Boolean}
   */
  isBN: function(object) {
    return BN.isBN(object);
  },

  fromNanoPoly: function(number, unit, optionsInput) {
        nanopolys = numberToBN(number); // eslint-disable-line
        var negative = polys.lt(zero); // eslint-disable-line
    base = getUnitValue(unit);
    const baseLength = baseString.length - 1 || 1;
    const options = optionsInput || {};

    if (negative) {
      nanopolys = nanopolys.mul(negative1);
    }

        var fraction = nanopolys.mod(base).toString(10); //eslint-disable-line

    while (fraction.length < baseLength) {
      fraction = `0${fraction}`;
    }

    if (!options.pad) {
      fraction = fraction.match(/^([0-9]*[1-9]|0)(0*)/)[1];
    }

        var whole = nanopolys.div(base).toString(10); //eslint-disable-line
    if (options.commify) {
      whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
        var value = `${whole}${fraction == '0' ? '' : `.${fraction}`}`; // eslint-disable-line

    if (negative) {
      value = `-${value}`;
    }

    return value;
  },

  getUnitValue: function(unit) {
    if (!unit === "poly") {
      throw new Error(
        'This unit "' + unit + '"does\'t exist, please use "poly"'
      );
    }
    return new BN(1e9);
  }
};

module.exports = BramblUtils;
