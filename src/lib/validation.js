const stdErr = require("../core/standardError");

const checkExists = async (model, email, { serviceName = "", session }) => {
  try {
    // prettier-ignore
    const doc = session ? await model.findOne({"email": email}).session(session) : await model.findOne({"email": email})
    if (!doc) {
      throw stdErr(
        404,
        "No document found",
        "A document could not be found with the given email",
        serviceName
      );
    } else {
      return doc;
    }
  } catch (error) {
    throw error;
  }
};

const checkExistsByAddress = async (model, address, session) => {
  //prettier-ignore
  let obj = {};
  // eslint-disable-next-line no-unused-vars
  const doc = session
    ? await model
        .findOne({ address: address })
        .session(session)
        .catch(function(err) {
          console.error(err);
          obj.error = err.message;
          return obj;
          // eslint-disable-next-line no-unused-vars
        })
    : await model.findOne({ address: address }).catch(function(err) {
        console.error(err);
        obj.error = err.message;
        return obj;
      });
  if (!doc) {
    console.error("Unable to find address in DB");
    obj.error = "Unable to find address in DB";
    return obj;
  }
  return doc;
};

const checkExistsById = async (model, id, { serviceName = "", session }) => {
  try {
    // prettier-ignore
    const doc = session ? await model.findById(id).session(session) : await model.findById(id)
    if (!doc)
      throw stdErr(
        404,
        "No document found",
        "A document could not be found with the given ObjectId",
        serviceName
      );
    return doc;
  } catch (error) {
    throw error;
  }
};

module.exports = { checkExists, checkExistsById, checkExistsByAddress };
