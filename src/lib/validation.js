const { connectionIsUp, doesCollectionExist } = require("../lib/db/mongodb");

const checkExists = async (model, value, valueName) => {
  let obj = {};
  try {
    if (await connectionIsUp()) {
      const collectionExistence = await doesCollectionExist(
        model.collection.collectionName
      );
      if (collectionExistence.result) {
        const doc = await model.findOne({ [valueName]: value });
        if (!doc) {
          console.error(`${valueName} not found in db`);
          obj.error = `${valueName} not found in db`;
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
      return obj;
    }
  } catch (error) {
    console.error(error);
    obj.error = error.message;
    return obj;
  }
};

const findAll = async (model, values, valueName) => {
  let obj = {};
  try {
    if (await connectionIsUp()) {
      const collectionExistence = await doesCollectionExist(
        model.collection.collectionName
      );
      if (collectionExistence.result) {
        const doc = await model.find({
          [valueName]: { $in: values }
        });
        if (!doc) {
          console.error(`Unable to find the ${valueName}s for the request`);
          obj.error = `Unable to find the ${valueName}s for the request`;
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
      return obj;
    }
  } catch (error) {
    console.error(error);
    obj.error = error.message;
    return obj;
  }
};

const checkExistsById = async (model, id, session) => {
  let obj = {};
  try {
    // prettier-ignore
    if (await connectionIsUp()) {
      const collectionExistence = await doesCollectionExist(
        model.collection.collectionName
      );
      if (collectionExistence.result) {
        const doc = session ? await model.findById(id).session(session) : await model.findById(id);
        if (!doc) {
          console.error(`Element from collection ${model.collection.collectionName} not found in db`);
          obj.error = `Element from collection ${model.collection.collectionName} not found in db`
          return obj;
        } else {
          obj.doc = doc;
          return obj;
        }
      } else {
        console.error("MongoDb Collection Does Not Exist");
        obj.error = "MongoDB Collection Does Not Exist";
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

module.exports = {
  checkExists,
  checkExistsById,
  findAll
};
