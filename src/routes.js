const shortid = require('shortid')
function routes(app, dbe, brambl, addresses) {
    // Registration endpoint for registering users via email. We need to be able to identify each user so that we can look up their addresses and keyfiles
    let db = dbe.collection('topl-users')

    app.post('/register', (req, res) => {
        let email = req.body.email
        let idd = shortid.generate()
        if (email) {
            db.findOne({email}, (err, doc) => {
                if(doc) {
                    res.status(400).json({"status": "Failed", "reason":"Already registered"})
                } else {
                    db.insertONe({email})
                    res.json({"status":"success", "id": idd})
                }
            })
        } else {
            res.status(400).json({"status":"Failed", "reason": "wrong input"})
        }
    })
    // Login endpoint for users by email
    app.post('/login', (req, res) => {
        let email = req.body.email
        if (email) {
            db.findOne({email}, (err, doc) => {
                if (doc) {
                    res.json({"status":"success", "id":doc.id})
                } else {
                    res.status(400).json({"status":"Failed", "reason": "Not recognised"})
                }
            }
            )
        } else {
            res.status(400).json({"status":"Failed", "reason":"wrong input"})
        }
    })
    // Create asset endpoint for users -- ideally the front-end will correctly format the data for use by the backend 
    app.post('/asset', (req, res) => {
        let data = req.body.data
        let name = req.body.name
        if (data) {
            let assetCode = brambl.createAssetCode(name)
            let rawAssetParams = {
                "propositionType": "PublicKeyCurve25519",
                "recipients": [
                    [addresses[1], 1]
                ], 
                "assetCode" : assetCode,
                "sender" : [addresses[0]],
                "changeAddress": addresses[0],
                "minting": true,
                "fee": 1000000000
            }
            // default parameters timeout: 90, interval: 3, maxFailedQueries: 10

            let pollParams = {
                "timeout": 90,
                "interval": 3,
                "maxFailedQueries": 10
            }; 

            brambl.transaction('createRawAssetTransfer', rawAssetParams)
            .then(res => {
                res.json({"status": "unconfirmed transaction"})
            })
            .catch(err => {
                res.status(500).json({"status": "Failed", "reason": "Posting data error occurred"})
            })
            .then(res => {
                brambl.requests.pollTx(res.rsult.txId, pollParams)
            })
        } else {
            res.status(400).json({"status:": "Failed", "reason": "wrong input"})
        }
    })
}