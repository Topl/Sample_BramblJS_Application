import { NIL as NIL_UUID } from 'uuid';
import brambl from require('../src/app/helpers/brambl.js');
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
let keyfileObject = {
    "address_id": ObjectID(NIL_UUID),
    "user_id": ObjectID(NIL_UUID),
    "keyfile": keyfile,
    "password"
}


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

        })
    })
})

