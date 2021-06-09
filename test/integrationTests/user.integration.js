/* eslint-disable no-undef */
const MockUser = require("../mockData/mockUser");
const User = require("../../src/modules/v1/user/user.model");
const ObjectValidator = require("../lib/ObjectValidator");
const {
  generateSingleFailureTests
} = require("../lib/generateSingleFailureTests");
const {
  generateChainedFailureTests
} = require("../lib/generatedChainedFailureTests");
const { userBefore } = require("../lib/userBefore");
const sinon = require("sinon");
const sandbox = sinon.createSandbox();
const assert = require("assert");
const mongoose = require("mongoose");

// failure conditions
const createFailureConditions = {
  method: "post",
  route: "/v1/user",
  conditions: [
    {
      description: "should fail if email missing",
      args: {
        firstName: "Mock",
        lastName: "User"
      },
      code: 400
    },
    {
      description: "should fail if email is invalid",
      args: {
        firstName: "Mock",
        lastName: "User",
        email: "notvalidEmail"
      }
    },
    {
      description: "should fail if firstName missing",
      args: {
        email: "mock@mock.com",
        lastName: "User"
      },
      code: 400
    },
    {
      description: "should fail if firstName invalid",
      args: {
        firstName: 0,
        email: "mock@mock.com",
        lastName: "User"
      },
      code: 400
    },
    {
      description: "should fail if lastName missing",
      args: {
        email: "mock@mock.com",
        firstName: "Mock"
      },
      code: 400
    },
    {
      description: "should fail if lastName invalid",
      args: {
        email: "mock@mock.com",
        firstName: "Mock",
        lastName: 0
      },
      code: 400
    }
  ]
};

const newUserParams = {
  email: "mock@mock.com",
  firstName: "Mock",
  lastName: "User"
};

const updateParams = {
  email: "update@update.com",
  firstName: "updatedFirstName",
  lastName: "updatedLastName"
};

const updateFailConditions = {
  integrationRequests: [
    {
      method: "get",
      route: "/v1/user",
      code: 200,
      staticArgs: null
    }
  ],
  testRequest: {
    method: "patch",
    testConfig: [
      {
        pathVars: ["myUserId"],
        route: "/v1/user/6022f4e79591130f7f8497e3",
        description: "should fail if email missing",
        staticArgs: {
          firstName: "updatedFirstName",
          lastName: "updatedLastName"
        },
        code: 400
      },
      {
        pathVars: ["myUserId"],
        route: "/v1/user/6022f4e79591130f7f8497e3",
        description: "should fail if email is invalid",
        staticArgs: {
          firstName: "updatedFirstName",
          lastName: "updatedLastName",
          email: "notvalidEmail"
        },
        code: 400
      },
      {
        pathVars: ["myUserId"],
        route: "/v1/user/6022f4e79591130f7f8497e3",
        description: "should fail if firstName is empty",
        staticArgs: {
          lastName: "updatedLastName",
          email: "updated@updated.com"
        },
        code: 400
      },
      {
        pathVars: ["myUserId"],
        route: "/v1/user/6022f4e79591130f7f8497e3",
        description: "should fail if firstName is invalid",
        staticArgs: {
          firstName: 0,
          lastName: "updatedLastName",
          email: "updated@updated.com"
        },
        code: 400
      },
      {
        pathVars: ["myUserId"],
        route: "/v1/user/6022f4e79591130f7f8497e3",
        description: "should fail if lastName is empty",
        staticArgs: {
          firstName: "updatedFirstName",
          email: "updated@updated.com"
        },
        code: 400
      },
      {
        pathVars: ["myUserId"],
        route: "/v1/user/6022f4e79591130f7f8497e3",
        description: "should fail if lastName is invalid",
        staticArgs: {
          firstName: "updatedFirstName",
          lastName: 0,
          email: "updated@updated.com"
        },
        code: 400
      }
    ]
  }
};

const deleteFailConditions = {
  integrationRequests: [
    {
      method: "get",
      route: "/v1/user",
      staticArgs: null,
      code: 200
    }
  ],
  testRequest: {
    method: "delete",
    testConfig: [
      {
        athVars: ["myUserId"],
        route: "/v2/user/6022f4e79591130f7f8497e3",
        description: "should fail if email missing",
        staticArgs: {},
        code: 400
      },
      {
        pathVars: ["myUserId"],
        route: "v1/user/6022f4e79591130f7f8497e3",
        description: "should fail if password invalid",
        staticArgs: {
          password: 100
        },
        code: 400
      }
    ]
  }
};

// integration tests
module.exports = function(app, request) {
  describe("User Module - Login", function() {
    before(userBefore(sandbox));
    after(() => {
      sandbox.restore();
    });

    // Success test
    it("should return a 200 status code and an unpriviliged user", function(done) {
      request(app)
        .post("/v1/user")
        .send(newUserParams)
        .expect(res => {
          ObjectValidator.validateUser(res.body.data);
          assert.strictEqual(res.body.data.status === "unconfirmed", true);
        })
        .end(done);
    });
    generateSingleFailureTests(createFailureConditions, request, app);
  });

  describe("User Module - Get User Information", function() {
    before(() => {
      //stub User
      let mockUser = MockUser.generateUser();

      var mockFindById = sandbox.stub(User, "findById");
      mockFindById
        .withArgs(sinon.match(mockUser._id.toString()))
        .returns(Promise.resolve(mockUser));

      var mockFindUser = sandbox.stub(User, "findOne");
      mockFindUser
        .withArgs(sinon.match({ email: "mock@mock.com" }))
        .returns(Promise.resolve(mockUser));
      mockFindUser
        .withArgs(sinon.match({ id: mockUser._id.toString() }))
        .returns(Promise.resolve(null));
    });
    after(() => {
      sandbox.restore();
    });

    // success test
    it("should return a 200 status code and a user", function(done) {
      request(app)
        .get("v1/user")
        .expect(200)
        .expect(res => {
          ObjectValidator.validateUser(res.body.data);
        })
        .end(done);
    });
  });

  describe("User Module - Update User Profile", function() {
    before(userBefore(sandbox));
    after(() => {
      sandbox.restore();
    });

    // Success Test
    it("should return a 200 status code and an updated user", function(done) {
      request(app)
        .get("/v1/user")
        .expect(200)
        .end(res => {
          request(app)
            .patch(`/v1/user/${res.body.data._id}`)
            .send(updateParams)
            .expect(200)
            .end((err, res) => {
              if (err) {
                done(err);
              } else {
                const updatesArr = Object.keys(updateParams).map(key => [
                  key,
                  updateParams[key]
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

  describe("User Module - Delete Account", function() {
    let mockFindById;
    beforeEach(() => {
      //stub User
      let mockUser = MockUser.generateUser();
      mockFindById = sandbox.stub(User, "findById");
      mockFindById.returns(Promise.resolve(mockUser));
      mockFindById.onCall(4).callsFake(() => {
        return {
          findById: sinon.stub().returnsThis(),
          populate: sinon.stub().returns(Promise.resolve(mockUser))
        };
      });

      var mockFindUser = sandbox.stub(User, "findOne");
      mockFindUser
        .withArgs(sinon.match({ email: "mock@mock.com" }))
        .returns(Promise.resolve(mockUser));
      mockFindUser
        .withArgs(sinon.match({ email: "mock@incorrect.com" }))
        .returns(Promise.resolve(null));

      sandbox.stub(User.prototype, "save").callsFake(function() {
        return Promise.resolve(this);
      });

      //stub session
      const mockSession = {
        endSession: function() {
          return "stubbed endSession";
        },
        startTransaction: function() {
          return "stubbed startTransaction";
        },
        commitTransaction: function() {
          return "stubbed commitTransaction";
        },
        abortTransaction: function() {
          return "stubbed abort transaction";
        }
      };
      sandbox
        .stub(mongoose, "startSession")
        .returns(Promise.resolve(mockSession));
    });
    afterEach(() => {
      sandbox.restore();
    });

    //Success Test
    it("should return a 200 status code and an empty object", function(done) {
      request(app)
        .get("/v1/user")
        .expect(200)
        .end(res => {
          request(app)
            .delete(`/v1/user/${res.body.data._id}`)
            .send({ user_id: newUserParams.email })
            .expect(200)
            .expect(res => {
              // check if object empty
              assert.strictEqual(!Object.keys(res.body.data).length, true);
            })
            .end(done);
        });
    });
  });
  generateChainedFailureTests(deleteFailConditions, request, app);
};
