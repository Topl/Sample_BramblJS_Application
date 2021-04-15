import { ObjectID } from "bson"
import {KeyfilesDAO} from "../src/dao/keyfilesDAO.mjs"
import {AddressesDAO} from "../src/dao/addressesDAO.mjs"

const testUser = {
    name: "foobar",
    email: "foobar@baz.com"
}

const newUser = {
    name: "barfoo",
    email: "baz@foobar.com"
}

