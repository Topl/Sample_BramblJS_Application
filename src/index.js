/* eslint-disable no-console */
const glob = require('glob')
const settings = require("./lib/mongoDBSettings")
const mongoose = require('mongoose')
import app from "./app.js"
import KeyfilesDAO from "./dao/keyfilesDAO.mjs"
import UsersDAO from "./dao/usersDAO.mjs"
import Envs from 'envs'

const clientOptions = {
    useNewUrlParser = true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}

const uri = settings.mongoURI

const ensureCollections = () => {
    glob.sync('**/*.model.js', {cwd: `{${process.cwd()}/src/modules}`})
        .map((filename) => require(`../modules/${filename}`))
        .forEach((model) => model.createCollection())
}

// TODO: Configure maximum connection pool size

// TODO: Configure timeouts (to avoid the program from waiting indefinitely)

module.exports = async() => {
    mongoose.connect(uri, clientOptions)

    mongoose.connection.on('connected', function () {
        ensureCollections()
        console.log('Mongoose connected to mongodb!')
    })

    mongoose.connection.once('open', () => {
        console.log('Connection now open')
    })

    mongoose.connection.on('error', function (err) {
        console.error('Mongoose default error: ' + err)
    })

    mongoose.connection.on('disconnected', function () {
        console.log('Mongoose default connection disconnected')
    })

}