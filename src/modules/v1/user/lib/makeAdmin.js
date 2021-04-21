const findAndUpdate = require("../../../../lib/findOneAndUpdate");
const UserModel = require(`../user.model`);

serviceName = "userAdmin";

const makeAdmin = async email => {
  try {
    const updateResponse = findAndUpdate(
      UserModel,
      { $set: { isAdmin: true } },
      { email: email },
      { serviceName: serviceName }
    );
    return updateResponse;
  } catch (e) {
    return { error: e };
  }
};
