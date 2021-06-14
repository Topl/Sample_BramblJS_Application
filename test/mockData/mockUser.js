const mongoose = require("mongoose");
const attachCommonMethods = require("./attachCommonMethods");

class MockUser {
    static generateUser(isActive) {
        const ts = new Date();
        const tsString = ts.toISOString();
        var mockUser = {
            role: "UNPRIVILEGED",
            addresses: [],
            _id: mongoose.Types.ObjectId("5fd1165a92e3492bb32391fa"),
            firstName: "Mock",
            lastName: "Data",
            email: "mock@mock.com",
            dateCreated: tsString,
            lastUpdated: tsString,
            isActive: {
                status: isActive,
                asOf: tsString,
            },
            __v: 0,
        };
        mockUser = attachCommonMethods(mockUser);
        return mockUser;
    }
}

module.exports = MockUser;
