const BramblJS = require("brambljs")

class RequestValidator {

    static validateAddress(value, {req}) {
        try {
            if (!value || typeof value !== "string" || value === "") {
                return Promise.reject("Please enter a valid Address");
            }
            const result = BramblJS.utils.validateAddressesByNetwork(req.body.network, [value]);
            if (result.success) {
                return Promise.resolve();
            } else {
                return Promise.reject("Address invalid");
            }
        } catch (err) {
            console.log(err);
            return Promise.reject("Address must be base58 encoded")
        }
        
    }

    static validateNetwork(value) {

    
        // Check that the networks field is not empty, a string, and a valid network

        const networks = ["toplnet", "valhalla", "local", "private"];
        if (!value || typeof value !== "string" || !networks.includes(value)) {
            return Promise.reject("Please provide a valid network");
        }
        return Promise.resolve();
    }


}

module.exports = RequestValidator;