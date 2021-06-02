const MockUser = require("../mockData/mockUser");
const User = require("../../src/modules/v1/user/user.model");
const sinon = require("sinon");
const mongoose = require("mongoose");

module.exports = sandbox => {
  //stub User
  let mockUser = MockUser.generateUser();
  var mockFindUser = sandbox.stub(User, "findOne");
  mockFindUser
    .withArgs(sinon.match({ email: "mock@mock.com" }))
    .returns(Promise.resolve(mockUser));
  mockFindUser
    .withArgs(sinon.match({ email: "mock@incorrect.com" }))
    .returns(Promise.resolve(null));

  // stub save on User document
  sandbox.stub(User.prototype, "save").callsFake(function() {
    return Promise.resolve(this);
  });

  // stub session
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
  sandbox.stub(mongoose, "startSession").returns(Promise.resolve(mockSession));
};
