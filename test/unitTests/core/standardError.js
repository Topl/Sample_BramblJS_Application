const chai = require("chai");
const expect = chai.expect;
const standardError = require("../../../src/core/standardError");

describe("Standard Error", function () {
    it("It should return an error object in a specified format", function () {
        let errorObject = standardError(400, "Input Error", "error", "service");
        expect(errorObject).to.eql({ status: 400, msg: "[service] Input Error", data: "error" });
    });
});
