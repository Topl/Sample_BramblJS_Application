import AddressesDAO from "../src/core/dao/moviesDAO.mjs"

describe("Connection", () => {
    beforeAll(async () => {
        await AddressesDAO.injectDB(global.toplClient)
    })

    test("Can access topl data", async () => {
        const topl = global.toplClient.db(process.env.TOPL_NS)
        const collections = await topl.listCollections().toArray()

    })
})