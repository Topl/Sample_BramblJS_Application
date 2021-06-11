/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const MockUser = require("../mockData/mockUser");
const User = require("../../src/modules/v1/user/user.model");
const ObjectValidator = require("../lib/ObjectValidator");
const generateSingleFailureTests = require("../lib/generateSingleFailureTests");
const generateChainedFailureTests = require("../lib/generatedChainedFailureTests");
const sinon = require("sinon");
const sandbox = sinon.createSandbox();
const assert = require("assert");
const mongoose = require("mongoose");

// failure conditions
const createFailureConditions = {
    method: "post",
    route: "/api/v1/user/register/",
    conditions: [
        {
            description: "should fail if email missing",
            args: {
                firstName: "Mock",
                lastName: "User",
            },
            code: 400,
        },
        {
            description: "should fail if email is invalid",
            args: {
                firstName: "Mock",
                lastName: "User",
                email: "notvalidEmail",
            },
            code: 400,
        },
        {
            description: "should fail if firstName missing",
            args: {
                email: "mock@mock.com",
                lastName: "User",
            },
            code: 400,
        },
        {
            description: "should fail if firstName invalid",
            args: {
                firstName: 0,
                email: "mock@mock.com",
                lastName: "User",
            },
            code: 400,
        },
        {
            description: "should fail if lastName missing",
            args: {
                email: "mock@mock.com",
                firstName: "Mock",
            },
            code: 400,
        },
        {
            description: "should fail if lastName invalid",
            args: {
                email: "mock@mock.com",
                firstName: "Mock",
                lastName: 0,
            },
            code: 400,
        },
    ],
};

const newUserParams = {
    email: "mock@mock.com",
    firstName: "Mock",
    lastName: "User",
};

const updateParams = {
    email: newUserParams.email,
    newEmail: "update@update.com",
    firstName: "updatedFirstName",
    lastName: "updatedLastName",
};

const updateParamsResult = {
    email: updateParams.newEmail,
    firstName: updateParams.firstName,
    lastName: updateParams.lastName,
};

const retrievalParams = {
    user_id: "mock@mock.com",
    requestedEmail: "mock@mock.com",
};

const updateFailConditions = {
    integrationRequests: [
        {
            method: "get",
            route: "/api/v1/user/",
            code: 200,
            staticArgs: null,
        },
    ],
    testRequest: {
        method: "patch",
        testConfig: [
            {
                route: "/api/v1/user/",
                description: "should fail if email missing",
                staticArgs: {
                    firstName: "updatedFirstName",
                    lastName: "updatedLastName",
                },
                code: 401,
            },
            {
                route: "/api/v1/user/",
                description: "should fail if email is invalid",
                staticArgs: {
                    firstName: "updatedFirstName",
                    lastName: "updatedLastName",
                    user_id: 17,
                },
                code: 403,
            },
            {
                route: "/api/v1/user/",
                description: "should fail if firstName is invalid",
                staticArgs: {
                    firstName: 0,
                    lastName: "updatedLastName",
                    user_id: "updated@updated.com",
                },
                code: 403,
            },
            {
                route: "/api/v1/user/",
                description: "should fail if lastName is invalid",
                staticArgs: {
                    firstName: "updatedFirstName",
                    lastName: 0,
                    user_id: "updated@updated.com",
                },
                code: 403,
            },
        ],
    },
};

const deleteFailConditions = {
    integrationRequests: [
        {
            method: "get",
            route: "/api/v1/user/",
            staticArgs: null,
            code: 200,
        },
    ],
    testRequest: {
        method: "delete",
        testConfig: [
            {
                route: "/api/v1/user/",
                description: "should fail if email missing",
                staticArgs: {},
                code: 401,
            },
            {
                route: "/api/v1/user/",
                description: "should fail if password invalid",
                staticArgs: {
                    password: 100,
                },
                code: 401,
            },
        ],
    },
};

// integration tests
module.exports = function (app, request) {
    describe("User Module - Login", function () {
        beforeEach(() => {
            //stub User
            let mockUser = MockUser.generateUser(true);
            var mockFindUser = sandbox.stub(User, "findOne");
            mockFindUser.withArgs(sinon.match({ email: "mock@mock.com" })).returns(Promise.resolve(mockUser));
            mockFindUser.withArgs(sinon.match({ email: "mock@incorrect.com" })).returns(Promise.resolve(null));

            // stub save on User document
            sandbox.stub(User.prototype, "save").callsFake(function () {
                return Promise.resolve(this);
            });

            // stub session
            const mockSession = {
                endSession: function () {
                    return "stubbed endSession";
                },
                startTransaction: function () {
                    return "stubbed startTransaction";
                },
                commitTransaction: function () {
                    return "stubbed commitTransaction";
                },
                abortTransaction: function () {
                    return "stubbed abort transaction";
                },
            };

            // stub connection
            const mockConnection = {
                readyState: 1,
            };

            sandbox.stub(mongoose, "startSession").returns(Promise.resolve(mockSession));
            sandbox.stub(mongoose, "connection").returns(Promise.resolve(mockConnection));
        });
        afterEach(() => {
            sandbox.restore();
        });

        // Success test
        it("should return a 200 status code and an unpriviliged user", function (done) {
            request(app)
                .post("/api/v1/user/register/")
                .set("Accept", "application/json")
                .set("Content-Type", "application/json")
                .send(newUserParams)
                .expect("Content-Type", /json/)
                .expect((res) => {
                    ObjectValidator.validateUser(res.body.data);
                    assert.strictEqual(res.body.data.isActive.status, true);
                })
                .end(done);
        });
        generateSingleFailureTests(createFailureConditions, request, app);
    });

    describe("User Module - Get User Information", function () {
        before(() => {
            //stub User
            let mockUser = MockUser.generateUser(true);
            var mockFindUser = sandbox.stub(User, "findOne");

            var mockFindById = sandbox.stub(User, "findById");
            mockFindById.withArgs(sinon.match(mockUser._id.toString())).returns(Promise.resolve(mockUser));
            mockFindUser.withArgs(sinon.match({ email: "mock@mock.com" })).returns(Promise.resolve(mockUser));
            mockFindUser.withArgs(sinon.match({ email: "mock@incorrect.com" })).returns(Promise.resolve(null));
            // stub connection
            const mockConnection = {
                readyState: 1,
            };
            sandbox.stub(mongoose, "connection").returns(Promise.resolve(mockConnection));
        });
        after(() => {
            sandbox.restore();
        });

        // success test
        it("should return a 200 status code and a user", function (done) {
            request(app)
                .get("/api/v1/user/")
                .send(retrievalParams)
                .expect(200)
                .expect((res) => {
                    ObjectValidator.validateUser(res.body.data);
                })
                .end(done);
        });
    });

    describe("User Module - Update User Profile", function () {
        beforeEach(() => {
            //stub User
            let mockUser = MockUser.generateUser(true);
            var mockFindById = sandbox.stub(User, "findById");
            mockFindById.withArgs(sinon.match(mockUser._id.toString())).returns(Promise.resolve(mockUser));
            var mockFindUser = sandbox.stub(User, "findOne");
            mockFindById.withArgs(sinon.match(mockUser._id.toString())).returns(Promise.resolve(mockUser));
            mockFindUser.withArgs(sinon.match({ email: "mock@mock.com" })).returns(Promise.resolve(mockUser));
            mockFindUser.withArgs(sinon.match({ email: "mock@incorrect.com" })).returns(Promise.resolve(null));
            sandbox.stub(User.prototype, "save").callsFake(function () {
                return Promise.resolve(this);
            });
            const mockSession = {
                endSession: function () {
                    return "stubbed endSession";
                },
                startTransaction: function () {
                    return "stubbed startTransaction";
                },
                commitTransaction: function () {
                    return "stubbed commitTransaction";
                },
                abortTransaction: function () {
                    return "stubbed abort transaction";
                },
            };
            const mockConnection = {
                readyState: 1,
            };
            sandbox.stub(mongoose, "startSession").returns(Promise.resolve(mockSession));
            sandbox.stub(mongoose, "connection").returns(Promise.resolve(mockConnection));
        });
        afterEach(() => {
            sandbox.restore();
        });

        // Success Test
        it("should return a 200 status code and an updated user", function (done) {
            request(app)
                .get("/api/v1/user/")
                .send(retrievalParams)
                .expect(200)
                .end((retrievalErr, retrievalRes) => {
                    updateParams.user_id = retrievalRes.body.data.email;
                    request(app)
                        .patch(`/api/v1/user/`)
                        .send(updateParams)
                        .expect(200)
                        .end((err, res) => {
                            if (err) {
                                done(err);
                            } else {
                                const updatesArr = Object.keys(updateParamsResult).map((key) => [
                                    key,
                                    updateParamsResult[key],
                                ]);
                                ObjectValidator.validateUser(res.body.data);
                                ObjectValidator.validateUpdates(res.body.data, updatesArr);
                                done();
                            }
                        });
                });
        });
        generateChainedFailureTests(updateFailConditions, request, app);
    });

    describe("User Module - Delete Account", function () {
        let mockFindById;
        beforeEach(() => {
            //stub User
            let mockUser = MockUser.generateUser(true);
            var mockFindUser = sandbox.stub(User, "findOne");
            mockFindById = sandbox.stub(User, "findById");
            mockFindById.returns(Promise.resolve(mockUser));
            mockFindById.onCall(4).callsFake(() => {
                return {
                    findById: sinon.stub().returnsThis(),
                    populate: sinon.stub().returns(Promise.resolve(mockUser)),
                };
            });

            mockFindUser.withArgs(sinon.match({ email: "mock@mock.com" })).returns(Promise.resolve(mockUser));
            mockFindUser.withArgs(sinon.match({ email: "mock@incorrect.com" })).returns(Promise.resolve(null));

            sandbox.stub(User.prototype, "save").callsFake(function () {
                return Promise.resolve(this);
            });

            //stub session
            const mockSession = {
                endSession: function () {
                    return "stubbed endSession";
                },
                startTransaction: function () {
                    return "stubbed startTransaction";
                },
                commitTransaction: function () {
                    return "stubbed commitTransaction";
                },
                abortTransaction: function () {
                    return "stubbed abort transaction";
                },
            };

            // stub connection
            const mockConnection = {
                readyState: 1,
            };
            sandbox.stub(mongoose, "startSession").returns(Promise.resolve(mockSession));
            sandbox.stub(mongoose, "connection").returns(Promise.resolve(mockConnection));
        });
        afterEach(() => {
            sandbox.restore();
        });

        //Success Test
        it("should return a 200 status code and an empty object", function (done) {
            request(app)
                .get("/api/v1/user/")
                .send(retrievalParams)
                .expect(200)
                .end((retrievalErr, retrievalRes) => {
                    request(app)
                        .delete(`/api/v1/user/`)
                        .send({
                            user_id: newUserParams.email,
                            requestedEmail: newUserParams.email,
                        })
                        .expect(200)
                        .expect((res) => {
                            // check if object empty
                            assert.strictEqual(!Object.keys(res.body.data).length, true);
                        })
                        .end(done);
                });
        });
    });
    generateChainedFailureTests(deleteFailConditions, request, app);
};
