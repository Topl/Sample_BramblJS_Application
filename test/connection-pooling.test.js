import AddressesDAO from "../src/dao/addressesDAO.mjs"

describe("Connection Pooling", () => {
    beforeAll(async () => {
        await AddressesDAO.injectDB(global.toplClient)
    })

    test("Connection pool size is 50", async () => {
        const response = await AddressesDAO.getConfiguration()
        expect(response.poolSize).toBe(50)
    })
})