module.exports = (error) => {
    return {
        errors: {
            msg: error.msg,
            data: error.data.toString(),
        },
    }
}
