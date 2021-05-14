/**
 * Parse obj to retrieve addresses from the following keys:
 * ["recipients", "sender", "changeAddress", "consolidationAdddress", "addresses"]
 *
 * @param {object} obj json obj to retrieve addresses from
 * @returns {Array} list of addresses found in object
 */
function extractAddressesFromObj(obj) {
  // only push unique items in array, so that validation is faster
  let addresses = [];
  if (obj.constructor === String) {
    return [obj];
  }

  const addKeys = [
    "recipients",
    "senders",
    "changeAddress",
    "consolidationAdddress",
    "addresses"
  ];

  addKeys.forEach(addKey => {
    if (obj[addKey] && obj[addKey].length > 0) {
      if (addKey === "recipients") {
        obj[addKey].forEach(recipient => {
          // retrieve address from tuple
          addresses = addresses.concat(recipient[0]);
        });
      } else if (addKey === "senders") {
        obj[addKey].forEach(sender => {
          // retrieve address from tuple
          addresses = addresses.concat(sender[0]);
        });
      } else {
        addresses = addresses.concat(obj[addKey]);
      }
    }
  });

  return addresses.filter(function(value, index, self) {
    return self.indexOf(value) === index;
  });
}

module.exports = extractAddressesFromObj;
