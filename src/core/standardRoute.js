
const express = require('express')
const {validationResult} = require("express-validator")

const formatError = require(`../lib/formatError`)

module.exports = async (req, res, handler, args, responseMsg) => {
    //express validator return on any semantic errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()})
    }
    try {
        return res.status(200).json({
            msg: responseMsg.success,
            data: await handler(args),
        })
    } catch (err) {
        console.error(err)
        return err.status ? res.status(err.status).json(formatError(err)): res.sendStatus(500)
    }
}