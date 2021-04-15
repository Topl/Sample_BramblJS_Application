const MongoClient = require("mongodb").MongoClient
const NodeEnvironment = require("jest-environment-node")
module.exports = class MongoEnvironment extends NodeEnvironment {
    async setup() {
        if (!this.global.toplClient) {
            this.global.toplClient = await MongoClient.connect(
                process.env.TOPL_DB_URI,
                // TOD: Set the write timeout limit to 2500 milliseconds for the testing environment
                {useNewUrlParser: true,
                 poolSize = 50 
                }
            )
            await super.setup()
        }
    }

    async teardown() {
        await this.global.toplClient.close()
        await super.teardown()
    }

    runScript(script) {
        return super.runScript(script)
    }
}