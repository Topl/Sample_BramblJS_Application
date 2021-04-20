const Address = require("../modules/v1/user/user.model")

module.exports = async (email, page, limit) => {
    try {
        // if page is 0, offset =0, else calculate offset
        const offset = page == 0 ? 0 : page * limit;
        const addresses = await Address.find({email: email}).skip(offset).limit(limit);
        return addresses;
    } catch (err) {
        throw err;
    }
}