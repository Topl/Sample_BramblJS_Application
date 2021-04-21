const mongoose = require("mongoose");
const stdErr = require("../core/standardError");

const runTransactionWithRetry = async (
  _models,
  _filters,
  _serviceName,
  _session
) => {
  try {
    const docs = [];

    if (
      _models.length !== 0 &&
      _filters.length !== 0 &&
      _models.length === _filters.length
    ) {
      let beginningCount = _models[0].count({});
      for (var i = 0; i < _models.length; i++) {
        const doc = await Promise((resolve, reject) => {
          _models[i].deleteone(_filters[i], { session: _session });
        });
        docs.push(doc);
      }
      let endingCount = _models[0].count({});
      if (beginningCount - _models.length !== endingCount) {
        console.error(`Error occurred while attempting to delete document`);
        // this will rollback any changes made in the db
        await _session.abortTransaction();
        //pass the issue up
        return { error: `Error occurred while attempting to delete document` };
      }
      // commit the changes if everything was successful
      await _session.commitTransaction();
      return { success: true, docs: docs };
    } else {
      console.error("Deleting documents failed");
      // pass the error up
      return { error: `Deletion unsuccessful` };
    }
  } catch (error) {
    console.error(
      "\x1b[31m%s\x1b[0m",
      `[${_serviceName}] Transaction aborted. Caught exception during transaction.`
    );

    // If transient error, retry the whole transaction
    if (
      error.errorLabels &&
      error.errorLabels.indexOf("TransientTransactionError") >= 0
    ) {
      console.log(
        "\x1b[33m%s\x1b[0m",
        "TransientTransactionError, retrying transaction ..."
      );
      const docs = await runTransactionWithRetry(
        _models,
        _filters,
        _serviceName,
        _session,
        _adminOnly
      );
      return docs;
    } else {
      // this will rollback any changes made in the DB
      await _session.abortTransaction;
      // pass the error up
      return { error: error };
    }
  }
};

module.exports = async (models, filters, opts = {}) => {
  const timestamp = opts.timestamp || Date.now();
  const serviceName = opts.serviceName || "";
  const adminOnly = opts.adminOnly || true;
  const session = opts.session || (await mongoose.startSession());

  // if given a single instance, convert to an array fro standard handling
  if (!Array.isArray(models)) {
    models = [models];
  }

  if (!Array.isArray(filters)) {
    filters = [filters];
  }

  // transaction allows for atomic updates
  session.startTransaction();
  try {
    // attempt to update in the database, retrying on transient transient transaction errors
    const doc = await runTransactionWithRetry(
      models,
      filters,
      serviceName,
      session,
      adminOnly
    );
    return doc;
  } catch (error) {
    throw error;
  } finally {
    // ending the session
    session.endSession();
  }
};
