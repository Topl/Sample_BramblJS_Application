const stdErr = require('../core/standardError')

const checkExists = async (model, email, { serviceName = '', session }) => {
    try {
        // prettier-ignore
        const doc = session ? await model.findOne({"email": email}).session(session) : await model.findOne({"email": email})
        if (!doc)
            throw stdErr(404, 'No document found', 'A document could not be found with the given email', serviceName)
        return doc
    } catch (error) {
        throw error
    }
}

module.exports = { checkExists }