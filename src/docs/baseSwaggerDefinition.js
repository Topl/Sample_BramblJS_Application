const glob = require('glob')
const mongoose2swagger = require('mongoose-to-swagger')

//default mongoose-to-swagger to include properties if present
const additionalProps = ['ref', 'trim', 'unique', 'default']
const m2s = (model, _description) => {
    return {
        ...mongoose2swagger(model, {props: additionalProps}),
        description: _description,
    }
}

// find database models and save into an object to include in the base spec
const findModels = () => {
    const modelsArr = glob.sync('**/*.model.js', {cwd: `${process.cwd()}/src/modules`}).map((filename) => {
        const filenameArr = filename.split('/')
        const modelname = filenameArr[filenameArr.length - 1].split(".")[0]
        const swaggerObj = m2s(require(`../modules/${filename}`))
        return [modelname, swaggerObj]
    })

    return Object.fromEntries(modelsArr)
}

const models = findModels()

// external documents
const appDesc = `## Summary \n Base Microservice REST API. \n ## Description Node ExpressJS application for integration with the Topl blockchain. The repository for this code may be found at <https://github.com/Topl/Sample_BrambleJS_Application>. Data is stored in MongoDB.\n All available routes are outlined below with usage examples and possible error codes given.`

module.exports = {
    openai: `3.0.3`,
    info: {
        title: 'Sample-BramblJS-Application',
        version: '1.0.0',
        description: appDesc
    },
    contact: {
        name: "Sterling Wells",
        email: "s.wells@topl.me"
    },
    servers: [
        {
            url: 'http://localhost:5000',
            description: 'Local development environment',
        }
    ],
    tags: [
        {
            name: 'public',
            description: 'No authorization is required for calling these routes',
        }, 
        {
            name: 'permissioned',
            description: `Any authenticated user may access these resources (only resources for which they have access)`
        }
    ],
    security: [{ bearerAuth: [] }],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        schemas: {
            ...models,
            stdErr: {
                description: 'Standard error',
                type: Object,
                properties: {
                    errors: {
                        type: Object,
                        properties: {
                            msg: {
                                type: String,
                            },
                            data: {
                                type: String,
                            },
                        },
                    },
                },
            },
            expressValidatorError: {
                description: 'Express validator error response.',
                type: Object,
                properties: {
                    errors: {
                        type: 'array',
                        items: {
                            type: Object,
                            properties: {
                                value: {
                                    type: String,
                                },
                                msg: {
                                    type: String,
                                },
                                param: {
                                    type: String,
                                },
                                location: {
                                    type: String,
                                },
                            },
                        },
                    },
                },
            },
        },
        responses: {
            unknownInternalError: {
                description: 'Uncaught error response',
                content: {
                    'text/plain': {
                        schema: {
                            type: String,
                            example: 'Internal Server Error',
                        },
                    },
                },
            },
        },
    },
}