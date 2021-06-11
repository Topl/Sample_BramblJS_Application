const assert = require("assert");

class ObjectValidator {
    static validateUser(responseObj) {
        const fields = [
            "_id",
            "role",
            "addresses",
            "firstName",
            "lastName",
            "email",
            "dateCreated",
            "lastUpdated",
            "isActive",
        ];
        this.validateModel(responseObj, fields);
    }

    static validateUpdates(responseObj, updatesArr) {
        updatesArr.forEach(([key, update]) => {
            assert.strictEqual(responseObj[key], update);
        });
    }

    static validateModel(responseObj, fieldsArr) {
        fieldsArr.forEach((field) => {
            assert.strictEqual(responseObj.hasOwnProperty(field), true);
        });
    }
}

module.exports = ObjectValidator;
