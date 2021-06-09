const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        description: "First name of user",
    },
    lastName: {
        type: String,
        required: true,
        description: "Last name of user",
    },
    role: {
        type: String,
        enum: ["UNPRIVILEGED", "PRIVILEGED"],
        default: "UNPRIVILEGED",
    },
    email: {
        type: String,
        required: true,
        unique: true,
        description: "Email used as a proxy for the user id",
    },
    lastUpdated: {
        type: Date,
        required: true,
        description: "Date and time the user account was updated",
    },
    dateCreated: {
        type: Date,
        required: true,
        description: "Date and time the user account was created",
    },
    addresses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "address",
            description: "A reference to the addresses owned by this user",
        },
    ],
    isActive: {
        type: mongoose.Schema.Types.Mixed,
        status: {
            type: Boolean,
            default: true,
        },
        asOf: {
            type: Date,
        },
        required: true,
    },
});

UserSchema.methods.toJSON = function () {
    var obj = this.toObject();
    return obj;
};

// eslint-disable-next-line no-undef
module.exports = User = mongoose.model("user", UserSchema);
