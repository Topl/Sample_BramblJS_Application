const mongoose = require("mongoose");
const stdErr = require("../core/standardError");

const runTransactionWithRetry = async (
  _models,
  _updates,
  _filters,
  _serviceName,
  _upsert,
  _session
) => {
  try {
    const docs = [];
    // find and update the document using the session
    if (
      _models.length !== 0 &&
      _updates.length !== 0 &&
      _models.length == _updates.length
    ) {
      for (var i = 0; i < _models.length; i++) {
        const doc = await Promise((resolve, reject) => {
          _models[i].findOneAndUpdate(_filters[i], _updates[i], {
            upsert: _upsert,
            new: true,
            session: _session
          });
        });
        docs.push(doc);
      }
    }
    // commit the changes if everything was successful
    await _session.commitTransaction();
    return doc;
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
      const doc = await runTransactionWithRetry(
        _model,
        _update,
        _id,
        _args,
        _serviceName,
        _upsert,
        _session
      );
      return doc;
    } else {
      // this will rollback any changes made in the db
      await _session.abortTransaction();

      // pass the error up
      return { error: error };
    }
  }
};

module.exports = async (models, updates, filters, opts = {}) => {
  const timestamp = opts.timestamp || Date.now();
  const serviceName = opts.serviceName || "";
  const upsert = opts.upsert || true;
  const session = opts.session || (await mongoose.startSession());

  // if given a single instance, convert to an array fro standard handling
  if (!Array.isArray(models)) {
    models = [models];
  }

  if (!Array.isArray(updates)) {
    updates = [updates];
  }

  if (!Array.isArray(filters)) {
    filters = [filters];
  }

  // update the last modified date
  updates.map(update => (update.$set.lastModifiedDate = timestamp));

  // transaction allows for atomic updates
  session.startTransaction();
  try {
    // attempt to update in the database, retrying on transient transient transaction errors
    const doc = await runTransactionWithRetry(
      models,
      updates,
      filters,
      serviceName,
      upsert,
      session
    );
    return doc;
  } catch (error) {
    throw error;
  } finally {
    // ending the session
    session.endSession();
  }
};
