const chai = require("chai");
const { expect } = chai;

const formatError = require("../../../src/lib/formatError");

describe("Format Error", function () {
    it("It should return an errors object with message and data", function () {
        function TestError(data) {
            this.msg = "An error occurred";
            this.data = data;
        }
        const errorObj = new TestError("Test error");
        return expect(formatError(errorObj)).to.eql({
            errors: { msg: "An error occurred", data: "Test error" },
        });
    });
});
