const router = require('express').Router()
const fs = require('fs')
const swaggerJSDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

// Swagger definition
const swaggerDefinition = require('./baseSwaggerDefinition.js')

// options for the swagger docs
const options = {
    swaggerDefinition, // import base spec
    apis: ['./src/modules/**/*.yaml'], // path to the API docs
}

// initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options)

// write spec to disk
fs.writeFileSync('swaggerSpec.json', JSON.stringify(swaggerSpec))

// setup the behavior of the router for this route
router.use('/', swaggerUi.serve)
router.get('/', swaggerUi.setup(swaggerSpec))

module.exports = router