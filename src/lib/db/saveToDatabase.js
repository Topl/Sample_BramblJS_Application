const stdErr = require("../../core/standardError");
const dbUtil = require("./dbUtil");

async function commitWithRetry(session, _serviceName) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      session.commitTransaction();
      break;
    } catch (error) {
      // Can retry commit
      if (
        // eslint-disable-next-line no-prototype-builtins
        error.hasOwnProperty("errorLabels") &&
        error.errorLabels.includes("UnknownTransactionCommitResult")
      ) {
        continue;
      } else {
        // pass the error up
        throw stdErr(400, "Error saving to the database", error, _serviceName);
      }
    }
  }
}

const runTransactionWithRetry = async (_models, _session, _serviceName) => {
  // create an array of the data to be saved in the same session.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const result = await Promise.all(
        _models.map(model => model.save({ _session }))
      );
      await commitWithRetry(_session, _serviceName);
      return result;
    } catch (error) {
      // If transient error, retry the whole transaction
      if (
        // eslint-disable-next-line no-prototype-builtins
        error.hasOwnProperty("errorLabels") &&
        error.errorLabels.includes("TransientTransactionError")
      ) {
        continue;
      } else {
        // pass the error up
        try {
          await _session.abortTransaction();
        } catch (err) {
          console.error(err);
          throw stdErr(500, "Error saving to the database", err, _serviceName);
        }
        throw stdErr(400, "Error saving to the database", error, _serviceName);
      }
    }
  }
};

module.exports = async (inputModels, opts = {}) => {
  let obj = {};
  try {
    const [models, session, serviceName] = dbUtil(inputModels, opts);
    return runTransactionWithRetry(models, session, serviceName);
  } catch (error) {
    console.error(error);
    obj.error = error;
    return obj;
  }
};
