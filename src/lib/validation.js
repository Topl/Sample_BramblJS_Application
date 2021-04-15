const stdErr = require('../core/standardError')

const checkExists = async (model, id, { serviceName = '', session }) => {
    try {
        // prettier-ignore
        const doc = session ? await model.findById(id).session(session) : await model.findById(id)
        if (!doc)
            throw stdErr(404, 'No document found', 'A document could not be found with the given ObjectId', serviceName)
        return doc
    } catch (error) {
        throw error
    }
}

module.exports = { checkExists }