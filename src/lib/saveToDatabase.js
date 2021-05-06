const mongoose = require("mongoose");
const stdErr = require("../core/standardError");

const runTransactionWithRetry = async (_models, _session, _serviceName) => {
  try {
    // create an array of the data to be saved in the same session.
    const docs = await Promise.all(
      _models.map(model => model.save({ _session }))
    );

    //commit the changes if everything was successful
    await _session.commitTransaction();

    return docs;
  } catch (error) {
    // If transient error, retry the whole transaction
    if (
      error.errorLabels &&
      error.errorLabels.indexOf("TransientTransactionError") >= 0
    ) {
      // eslint-disable-next-line no-console
      console.log(
        "\x1b[33m%s\x1b[0m",
        "TransientTransactionError, retrying transaction ..."
      );
      const docs = await runTransactionWithRetry(_models, _session);
      return docs;
    } else {
      // this will rollback any changes made in the database
      await _session.abortTransaction();

      // pass the error up
      throw stdErr(400, "Error saving to the database", error, _serviceName);
    }
  }
};

module.exports = async (models, opts = {}) => {
  const timestamp = opts.timestamp || Date.now();
  const serviceName = opts.serviceName || "";
  const session = opts.session || (await mongoose.startSession());

  // if given a single instance, convert to an array for standard handling
  if (!Array.isArray(models)) {
    models = [models];
  }

  // update last modified date
  models.map(model => (model.lastUpdated = timestamp));

  //transaction allows for atomic updates
  session.startTransaction();

  try {
    //attempt to save to db, retrying on Transient transaction errors
    const docs = await runTransactionWithRetry(models, session, serviceName);
    return docs;
  } catch (error) {
    throw error;
  } finally {
    // ending the session
    session.endSession();
  }
};
