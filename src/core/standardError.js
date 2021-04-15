module.exports = (status, msg, err, serviceName = '') => {
    return {
        status,
        msg: `[${serviceName}] ${msg}`,
        data: err,
    }
}