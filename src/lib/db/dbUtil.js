module.exports = (models, opts = {}) => {
    const timestamp = opts.timestamp || Date.now();
    const serviceName = opts.serviceName || "";
    const session = opts.session;
    // if given a single instance, convert to an array for standard handling
    if (!Array.isArray(models)) {
        models = [models];
    }

    models.filter(function (el) {
        return el != null;
    });

    // update last modified date
    models.map((model) => (model.lastUpdated = timestamp));

    // start a transaction for the session that uses:
    // - read concern "snapshot"
    // - write concern "majority"
    session.startTransaction({
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
    });
    return [models, session, serviceName];
};
