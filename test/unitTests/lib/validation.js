const sinon = require("sinon");
const chai = require("chai");
const proxyquire = require("proxyquire");
const { expect } = chai;
const sandbox = sinon.createSandbox();
const { generateUser } = require("../../mockData/mockUser");

const User = require("../../../src/modules/v1/user/user.model");

describe("validation", function () {
    let validationModule;
    let stdErrSpy;
    let user;
    let userStub;
    before(() => {
        stdErrSpy = sandbox.stub();
        user = generateUser({});
        userStub = sandbox.stub(User, "findById").returns(Promise.resolve(user));
        validationModule = proxyquire("../../../src/lib/validation.js", { "../core/standardError": stdErrSpy });
    });
    after(() => {
        sandbox.restore();
    });
    it("throws a standard error object if a user does not exist", function () {
        userStub.returns(null);
        return validationModule.checkExists(User, "", "_id").catch(() => {
            expect(stdErrSpy.calledOnce).to.be.true;
            expect(stdErrSpy.args[0][0]).to.eql(404);
            expect(stdErrSpy.args[0][1]).to.eql("_id not found in db");
        });
    });
    it("returns an object if it exists", function () {
        userStub.returns(Promise.resolve(user));
        return validationModule.checkExists(User, "", "_id").then((res) => {
            expect(res).to.eql(user);
        });
    });
});
