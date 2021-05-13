const stdErr = require("../core/standardError");
const { connectionIsUp, doesCollectionExist } = require("../lib/mongodb");

const checkExists = async (model, email, { session }) => {
  let obj = {};
  try {
    // prettier-ignore
    const doc = session ? await model.find({"email": email}).session(session) : await model.find({"email": email})
    if (!doc) {
      obj.error = "A document could not be found with the given email";
      return obj;
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
  try {
    if (await connectionIsUp()) {
      const collectionExistence = await doesCollectionExist(
        model.collection.collectionName
      );
      if (collectionExistence.result) {
        const doc = session
          ? await model.findOne({ address: address }).session(session)
          : await model.findOne({ address: address });
        if (!doc) {
          console.error(`Address: ${address} not found in db`);
          obj.error = "The given address could not be found in the db";
          return obj;
        } else {
          obj.doc = doc;
          return obj;
        }
      } else {
        console.error("Mongoose Collection Does Not Exist");
        obj.error = "Mongoose Collection Does Not Exist";
        return obj;
      }
    } else {
      console.error(
        "Sample BramblJS Application is not connected to the DB. Please try again later"
      );
      obj.error =
        "Sample BramblJS Application is not connected to the DB. Please try again later";
      return obj;
    }
  } catch (error) {
    console.error(error);
    obj.error = error.message;
    return obj;
  }
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
