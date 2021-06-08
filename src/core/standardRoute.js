const { validationResult } = require("express-validator");

const formatError = require(`../lib/formatError`);

module.exports = async (req, res, next, handler, args, responseMsg) => {
    //express validator return on any semantic errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        return res.status(200).json({
            msg: responseMsg.success,
            data: await handler(args),
        });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json(formatError(err));
        } else {
            next(err);
        }
    }
};
