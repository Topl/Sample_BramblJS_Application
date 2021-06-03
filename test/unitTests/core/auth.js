/* eslint-disable no-undef */
const User = require("../../../src/modules/v1/user/user.model");
const MockUser = require("../../mockData/mockUser");
const mongoose = require("mongoose");
const Db = require("mongodb").Db;
const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");
const sandbox = sinon.createSandbox();
const authorizationMiddleware = require("../../../src/core/auth");
const connectMockDb = require("../../lib/testMongoDb");

describe("Core: Auth middleware", function () {
    let mockRequest;
    let mockResponse;
    let jsonSpy = sandbox.stub();
    let nextFunctionStub = sandbox.stub();
    let bodyStub;
    before(function () {
        connectMockDb();
        let responseStub = sandbox.stub().callsFake(() => {
            return {
                status: sandbox.stub().returnsThis(),
                json: jsonSpy,
            };
        });
        mockRequest = {};
        mockResponse = {
            status: responseStub,
        };
    });
    afterEach(function () {
        sandbox.restore();
    });
    it("It should return 401 status when there is no email", function () {
        bodyStub = sandbox.stub().returns("");
        mockRequest = {
            body: bodyStub,
        };
        authorizationMiddleware(mockRequest, mockResponse, nextFunctionStub);
        expect(jsonSpy.calledOnce).to.be.true;
        expect(jsonSpy.args[0][0]).eql({
            errors: [{ msg: "User Id is missing." }],
        });
    });
    it("It should return an error if the user does not exist", function () {
        bodyStub.withArgs("user_id").returns("mock@mock.com");
        sandbox.stub(User, "findById").returns(Promise.resolve(null));
        mockRequest = {
            body: bodyStub,
        };
        authorizationMiddleware(mockRequest, mockResponse, nextFunctionStub);
        // Does not call the next function, should instead throw an error
        expect(nextFunctionStub.callCount).to.eql(0);
    });
    it("It should return an error if the user is not active.", function () {
        bodyStub.withArgs("user_id").returns("mock@mock.com");
        sandbox.stub(User, "findById").returns(Promise.resolve(MockUser.generateUser(false)));
        mockRequest = {
            body: bodyStub,
        };
        authorizationMiddleware(mockRequest, mockResponse, nextFunctionStub);
        // Does not call the next function, should instead throw an error
        expect(nextFunctionStub.callCount).to.eql(0);
    });
    it("It should call next if the users are valid", function () {
        bodyStub.withArgs("user_id").returns("mock@mock.com");
        sandbox.stub(User, "findById").returns(Promise.resolve(MockUser.generateUser(true)));
        mockRequest = {
            body: bodyStub,
        };
        authorizationMiddleware(mockRequest, mockResponse, nextFunctionStub).then(() => {
            expect(nextFunctionStub.calledOnce).to.be.true;
        });
    });
});
