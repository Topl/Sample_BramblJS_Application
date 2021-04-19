const mongoose = require('mongoose')
const ObjectId = require('bson')
const stdErr = require('../core/standardError')

const runTransactionWithRetry = async(_models, _session, _serviceName) => {
    try {
        // create an array of the data to be saved in the same session. 
        const docs = await Promise.all(_models.map((model) =>
            model.save({_session})
        ))

        console.log("inserted document", docs_id)

        // let's ensure that we can find the document we just inserted

        if (docs.length !== 0 && _models.length !== 0 && docs.length === _models.length) {
            for (var i = 0; i < docs.length; i++) {
                if (!(await _models[i].findOne({
                    _id: ObjectId(docs[i]._id)
                },
                {session: _session}
                ))) {
                    console.error('Inserting documents failed')
                    // this will rollback any changes made in the db
                    await _session.abortTransaction()
                    // pass the error up
                    return {error: "Insertion unsuccessful"}
                }
            }
            // commit the changes if everything was successful
            await _session.commitTransaction()
            return {success: true, docs: docs}
        } else {
            console.error('Inserting documents failed')
            // this will rollback any changes made in the db
            await _session.abortTransaction()
            // pass the error up
            return {error: `Insertion Unsuccessful`}
        }
    } catch (error) {
        console.error(
            '\x1b[31m%s\x1b[0m',
            `[${_serviceName}] Transaction aborted. Caught exception during transaction.`
        )

        // return an error message stating we've tried to insert a duplicate key

        if (String(error).startsWith("MongoError: E11000 duplicate key error")) {
            return {error: "That address already exists"}
        }

        // If transient error, retry the whole transaction
        if (error.errorLabels && error.errorLabels.indexOf('TransientTransactionError') >= 0) {
            console.log('\x1b[33m%s\x1b[0m', 'TransientTransactionError, retrying transaction ...'
            )
            const docs = await runTransactionWithRetry(_models, _session)
            return docs
        } else {
            // this will rollback any changes made in the DB
            await _session.abortTransaction
            // pass the error up
            return {error: error}

        }
    }
}

module.exports = async (models, opts = {}) => {
    const timestamp = opts.timestamp || Date.now()
    const serviceName = opts.serviceName || ''
    const session = opts.session || (await mongoose.startSession())

    // if given a single instance, convert to an array for standard handling
    if (!Array.isArray(models)) {
        models = [models]
    }

    // update last modified date
    models.map((model) => (model.lastUpdated = timestamp))

    //transaction allows for atomic updates
    session.startTransaction()

    try {
        //attempt to save to db, retrying on Transient transaction errors
        const docs = await runTransactionWithRetry(models, session, serviceName)
        return docs
    } catch (error) {
        throw error
    } finally {
        // ending the session
        session.endSession()
    }
}