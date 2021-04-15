import { NIL as NIL_UUID } from 'uuid';
import brambl from require('../src/lib/brambl.js');
import { ObjectID } from "bson";
import {KeyfilesDAO} from "../src/dao/keyfilesDAO.mjs";
import {AddressesDAO} from "../src/dao/addressesDAO.mjs";

const testUser = {
    name: "foobar",
    email: "foobar@baz.com"
};

const newUser = {
    name: "barfoo",
    email: "baz@foobar.com"
};

const date = new Date()

let keyfile = await brambl.createAddress()

describe("Create/Update Keyfiles", () => {
    beforeAll(async () => {
        await AddressesDAO.injectDB(global.toplClient)
        await KeyfilesDAO.injectDB(global.toplClient)
    })

    afterAll(async () => {
        const keyfileCollection = await global.toplClient   
                                        .db(process.env.TOPL_NS)
                                        .collection("keyfiles")
        const deleteResult = await keyfileCollection.deleteMany({
            address_id: ObjectID(NIL_UUID)
        })
    })

    test("Can post a keyfile", async () => {
        const postKeyfileResult = await KeyfilesDAO.addKeyfile(
            ObjectID(NIL_UUID),
            ObjectID(NIL_UUID),
            keyfile,
            date
        )

        expect(postKeyfileResult.insertedCount).toBe(1)
        expect(postKeyfileResult.insertedId).not.toBe(null)

        const address = await AddressesDAO.getAddressById(ObjectID(NIL_UUID)).keyfileId

        expect(address[0]._id).toEqual(postKeyfileResult.insertedId)
    })

})

