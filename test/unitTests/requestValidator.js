const sinon = require("sinon");
const chai = require("chai");
const { assert } = chai;
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();
const requestValidator = require("../../src/lib/requestValidator.js");

describe("Request Validator", function () {
    after(() => {
        sandbox.restore();
    });
    describe("validateAddresses", function () {
        let value;
        let network = "private";
        beforeEach(() => {
            value = "";
        });
        it("Should reject a promise if the value is not a valid address", function () {
            return assert.isRejected(
                requestValidator.validateAddresses(value, network),
                "Please enter a valid list of Addresses"
            );
        });
        it("Reject a promise if an error is thrown in the try block", function () {
            value = "000000000000000000000000000000";
            return assert.isRejected(
                requestValidator.validateAddresses([value], network),
                "Address must be base58 encoded"
            );
        });

        it("Reject a promise if validation is not successful", function () {
            value = "JDfMMfDREU7pmxn3BTqBsd7uDFv29mnmQ129v3DAeAAQzmYYpzPD";
            return assert.isRejected(requestValidator.validateAddresses([value], ""), "Addresses invalid");
        });
        it("resolve a promise if validation is successful", function () {
            value = "AU9Qeik8BpBbiNnsDsxu5DVtpr6VGZBVRBdY3SSsSk1gXoNGX7Xp";
            return assert.isFulfilled(requestValidator.validateAddresses([value], network));
        });
    });
});
