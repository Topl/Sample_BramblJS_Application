const mongoose = require('mongoose')
const NIL_UUID = require('uuid').NIL;
const brambl = require('../src/lib/bramblHelper');
const ObjectID =  require("bson").ObjectId;
const KeyfileController = require('../src/modules/v1/keyfiles/keyfiles.controller')
const supertest = require("supertest")

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
    beforeEach((done) => {
        const url = `mongodb://127.0.0.1:27017/keyfiles_1`
        await mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true},
            () => done()
            )
    })

    afterEach((done) => {
        mongoose.connection.db.dropDatabase(() => {
            mongoose.connection.close(() => done())
        })
    })

    test("POST /keyfile", async done => {

        const post = await KeyfileController.apiPostKeyfile(
            {

            }
        )


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

