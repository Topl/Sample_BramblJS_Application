const stdErr = require("../core/standardError");
const { connectionIsUp, doesCollectionExist } = require("../lib/mongodb");

const checkExists = async (model, email, { session }) => {
  let obj = {};
  try {
    if (await connectionIsUp()) {
      const collectionExistence = await doesCollectionExist(
        model.collection.collectionName
      );
      if (collectionExistence.result) {
        const doc = session
          ? await model.findOne({ email: email }).session(session)
          : await model.findOne({ email: email });
        if (!doc) {
          console.error(`User with ${email} not found in db`);
          obj.error = "The given user could not be found in the db";
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

const checkExistsByBifrostId = async (model, bifrostId, session) => {
  //prettier-ignore
  let obj = {};
  try {
    if (await connectionIsUp()) {
      const collectionExistence = await doesCollectionExist(
        model.collection.collectionName
      );
      if (collectionExistence.result) {
        const doc = session
          ? await model.findOne({ bifrostId: bifrostId }).session(session)
          : await model.findOne({ bifrostId: bifrostId });
        if (!doc) {
          console.error(`Box with id: ${bifrostId} not found in db`);
          obj.error = "The given box could not be found in the db";
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
  checkExistsByAddress,
  checkExistsByBifrostId
};
