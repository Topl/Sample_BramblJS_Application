const sinon = require("sinon");
const chai = require("chai");
const expect = chai.expect;
const sandbox = sinon.createSandbox();
const standardRoute = require("../../../src/core/standardRoute");
const { assert } = require("chai");

describe("Standard Route", function () {
    let mockRequest;
    let mockResponse;
    let nextStub = sandbox.stub();
    let jsonSpy = sandbox.stub();
    let handlerStub;
    let responseStub;
    let handlerArgs = "handler arguments";
    before(() => {
        handlerStub = sandbox.spy();
        responseStub = sandbox.stub().callsFake(() => {
            return {
                status: sandbox.stub().returnsThis(),
                json: jsonSpy,
            };
        });
        mockResponse = {
            status: responseStub,
        };
    });
    afterEach(() => {
        sandbox.restore();
    });
    it("It calls validation method in case of an error", function () {
        // add express validation error to request
        mockRequest = {
            "express-validator#contexts": ["error"],
        };

        return standardRoute(mockRequest, mockResponse, nextStub, handlerStub, "args", "Response").then(() => {
            expect(responseStub.args[0][0]).to.eql(400);
        });
    });
    it("It returns a successful response if there is no error", function () {
        mockRequest = {};
        const responseMsg = {
            success: "success",
        };
        return standardRoute(mockRequest, mockResponse, nextStub, handlerStub, handlerArgs, responseMsg).then(() => {
            expect(responseStub.args[1][0]).to.eql(200);
            expect(handlerStub.args[0][0]).to.eql(handlerArgs);
            expect(jsonSpy.args[1][0]).to.eql({ msg: "success", data: undefined });
        });
    });
    it("It logs and returns error response with status in case of error", function () {
        const getErrorObj = ({ withStatus }) => ({
            status: withStatus ? 402 : null,
            data: "Test error",
        });
        const handlerFail = sandbox.stub().returns(
            Promise.reject(
                getErrorObj({
                    withStatus: true,
                })
            )
        );
        return standardRoute(mockRequest, mockResponse, nextStub, handlerFail, handlerArgs, {}).then(() => {
            expect(responseStub.args[3][0]).to.eql(402);
            expect(jsonSpy.args[2][0]).to.eql({ errors: { data: "Test error", msg: undefined } });
        });
    });
    it("It calls next middleware in case of an error with no status", function () {
        const handlerFail = sandbox.stub().returns(Promise.reject(new Error()));
        return standardRoute(mockRequest, mockResponse, nextStub, handlerFail, handlerArgs, {}).then(() => {
            expect(nextStub.callCount).to.eql(1);
            assert.instanceOf(nextStub.args[0][0], Error);
        });
    });
});
