//const AdminBljs = require('./adminbljs');
const BramblJS = require("brambljs");

//console.log("Valid Networks: " + BramblJS.utils.getValidNetworksList());

//const AdminBrambl = require('./adminbljs/src/AdminBrambl');

// let unlockedKeySenderAddress;
// let unlockedKeyRecipientAddress;

const myKeyPath1 =
  "hel_keyfiles/5jbNEm3Js83e7kNpbpsTVv7rbFnT8P6mszgcrZqYWrmQKqSQtiZh.json";
// const myKeyPath2 = "hel_keyfiles/5jcoHDP4L6Q2kpFrL3xTC1Psd7MkFav7TaHi2HbwCAoC6B6DcLN7.json";
// const myKeyPath3 = "hel_keyfiles/hel_keyfile.json";

const keyManager1 = BramblJS.KeyManager({
  password: "8NdWykvjsKZV",
  keyPath: myKeyPath1
});

// const keyManager2 = BramblJS.KeyManager({
//     password: "EcW5q76vEzOr",
//     keyPath: myKeyPath2
// })

// const keyManager = BramblJS.KeyManager({
//     password: "8NdWykvjsKZV",
//     keyPath: myKeyPath3
// })

// // let dirPath = "./keyfiles-sample-dir"
// // keyManager.exportToFile(dirPath);

// // const storage = keyManager.getKeyStorage();

// // const adminBLJInstance = new AdminBrambl({
// //     networkPrefix: "private",
// //     KeyManager: keyManager,
// //     password: "topl_the_world!"
// // })

// // adminBLJInstance.requests.listOpenKeyfiles().then(

//     // on a successful request
//     // function(response) {
//     //     try {
//         // if the result is non-null update the addresses
//         // unlockedKeyRecipientAddress = response.result.unlocked[0];
//         // unlockedKeySenderAddress = response.result.unlocked[1];

//     //     const paramsSender = {
//     //         address: unlockedKeySenderAddress,
//     //         network: "private"
//     //     }

//     //     const paramsRecipient = {
//     //         address: unlockedKeyRecipientAddress,
//     //         network: "private"
//     //     }

//     //     adminBLJInstance.requests.checkValidAddress(paramsSender)
//     // .then((res) => console.log(res))
//     // .catch((e) => console.error(e))

//     // adminBLJInstance.requests.checkValidAddress(paramsRecipient)
//     // .then((res) => console.log(res))
//     // .catch((e) => console.error(e))

// //const requests = BramblJS.Requests("valhalla", "https://valhalla.torus.topl.network", "topl_the_world!")

//     // network prefix is required and must match the networkPrefix for requests and keyManager

// const brambl = new BramblJS({
//         networkPrefix: "valhalla",
//         KeyManager: keyManager1, //applies to Requests and KeyManager
//         Requests: {
//             url: "https://staging.vertx.topl.services/valhalla/605b5ae853db61085c0110bf", // set url
//             apiKey: "NjJmM2I5MWYtNDhhNy00MWRiLTgwYjEtNTg2NmI2NmYyM2Mw"
//         }
// });

const brambl1 = new BramblJS({
  networkPrefix: "hel",
  KeyManager: keyManager1,
  Requests: {
    url: "https://hel.torus.topl.network",
    apiKey: "obsession-arise-recast"
  }
});

//  const brambl2 = new BramblJS({
//          networkPrefix: "hel",
//          KeyManager: keyManager2,
//          Requests: {
//              url: "https://hel.torus.topl.network", // set url
//              apiKey: "obsession-arise-recast"
//          }
//  })

// console.log("Address: " + brambl.keyManager.address);

//Retrieving the timestamp of the latest block
// brambl.requests.getLatestBlock().then(response => {
//     const timestamp = new Date(response.result.bestBlock.header.timestamp);
//     const blockHeight = response.result.bestBlock.header.height
//     console.log('Block #' + blockHeight + ' forged ' + timestamp)
// }
// ).catch(error => console.log('Error', error));

// // Create an new AssetCode to be used in Create Raw Asset Transactions

// const assetCode1 = brambl1.createAssetCode("asset1");
// // const assetCode2 = brambl2.createAssetCode("asset2")

// // // Create Raw Asset Transfer and sign Tx
const address1 = brambl1.keyManager.address;
// const address2 = brambl2.keyManager.address;
// const address = brambl.keyManager.address;

//  const rawAssetParams1 = {
//    "propositionType": "PublicKeyCurve25519",
//    "recipients": [
//      // basic: [address, quantity]
//      // advance: [address, quantity, securityRoot, metadata]
//      [address1, 30]
//    ],
//    "assetCode": assetCode1,
//    "sender": [address1],
//    "changeAddress": address1,
//    "minting": true,
//    "fee": 1000000001
//  };

//   const rawAssetParams2 = {
//       "propositionType": "PublicKeyCurve25519",
//       "recipients": [
//         // basic: [address, quantity]
//         // advance: [address, quantity, securityRoot, metadata]
//         [address2, 30]
//       ],
//       "assetCode": assetCode2,
//       "sender": [address2],
//       "changeAddress": address2,
//       "minting": true,
//       "fee": 1000000001
//     };

// // default parameters timeout: 90, interval: 3, maxFailedQueries: 10

//  const pollParams = {
//      "timeout": 90,
//      "interval": 3,
//      "maxFailedQueries": 10
//  };

//  brambl2.requests.lookupBalancesByAddresses({addresses: [address2]})
//    .then((res) => console.log(res))
//    .catch((e) => console.error(e));

// brambl1.transaction('createRawAssetTransfer', rawAssetParams1)
// .catch((e) => console.error(e))
// .then(res => { console.log('Unconfirmed transaction'); console.log(res); return res })
// .then(res => brambl1.pollTx(res.result.txId, pollParams))
// .then(res => {console.log(res); return res;})
brambl1.requests
  .lookupBalancesByAddresses({ addresses: [address1] })
  .then(res => {
    console.log(res.result[address1].Boxes.AssetBox);
    return res;
  })
  .catch(e => console.error(e));

// // let b = await brambl2.transaction('createRawAssetTransfer', rawAssetParams2)
// // .catch((e) => console.error(e))
// // .then(res => { console.log('Unconfirmed transaction'); console.log(res); return res })
// // .then(res => brambl2.pollTx(res.result.txId, pollParams))
// // .catch((e) => console.error(e))

//  brambl1.requests.lookupBalancesByAddresses({addresses: [address1, address2]})
//       .then((res) => console.log(res))
//       .catch((e) => console.error(e));

// //Create Raw Poly Transfer and sign Tx
// // const address = brambl.keyManager.address;

// const rawAssetParams = {
//   "propositionType": "PublicKeyCurve25519",
//   "recipients": [
//     [address, 2]
//   ],
//   "sender": [address],
//   "changeAddress": address,
//   "fee": "100000000"
// };

// brambl.transaction('createRawPolyTransfer', rawAssetParams)
// .catch((e) => console.error(e))
// .then(res => {console.log('Unconfirmed transaction'); console.log(res); return res })
// .then(res => brambl.pollTx(res.result.txId, pollParams))
// .then(res => console.log(res))
// .catch((e) => console.error(e))

// const addresses = [brambl.keyManager.address];
// brambl.requests.lookupBalancesByAddresses({addresses: addresses})
//   .then((res) => console.log(res))
//   .catch((e) => console.error(e));

// brambl.requests.getMempool()
//   .then((res) => console.log(res))
//   .catch((e) => console.error(e));

// // brambl.requests.getBlockByHeight({"height": 3})
// // .then((res) => console.log(res))
// // .catch((e) => console.error(e));

// // } catch (error) {
// //             // Catch if the response cannot be parsed correctly
// //             console.error("Unexpected API responsoe from listOpenKeyFiles ", error);
// //         }
// //     },
// //     // on error response from Bifrost client
// //     function(response) {
// //         failureResponse = response.error ? response.error.message: "Uncaught Exception";
// //     }

// // )

// // //Create Raw Arbit Transfer and sign Tx
// // const address = brambl.keyManager.address;

// // const rawAssetParams = {
// //   "propositionType": "PublicKeyCurve25519",
// //   "recipients": [
// //     [address, 2]
// //   ],
// //   "sender": [address],
// //   "changeAddress": address,
// //   "consolidationAddress": address,
// //   "fee": 1,
// //   "data": "",
// // };

// // brambl.requests.createRawArbitTransfer(rawAssetParams)
// // .then(response => {
// //             const timestamp = new Date(response.result.rawTx.timestamp);
// //             for (var box in response.result.rawTx.newBoxes) {
// //                 console.log('Box Id' + box.id + ' retrieved ' + timestamp)
// //             }
// //         })
// // .catch(console.log)

// // Create Raw Poly Transfer and sign Tx
// // const address = brambl.keyManager.address;

// // const rawAssetParams = {
// //   "propositionType": "PublicKeyCurve25519",
// //   "recipients": [
// //     [address, 2]
// //   ],
// //   "sender": [address],
// //   "changeAddress": address,
// //   "fee": 1,
// //   "data": "",
// // };

// // brambl.requests.createRawPolyTransfer(rawAssetParams)
// // .then(response => {
// //             const timestamp = new Date(response.result.rawTx.timestamp);
// //             for (var box in response.result.rawTx.newBoxes) {
// //                 console.log('Box Id' + box.id + ' retrieved ' + timestamp)
// //             }
// //         })
// // .catch(console.log)

// // const addresses = [brambl.keyManager.address];
// // brambl.requests.lookupBalancesByAddresses({addresses: addresses})
// //   .then((res) => console.log(res))
// //   .catch((e) => console.error(e));

// // brambl.requests.getMempool()
//   .then((res) => console.log(res))
//   .catch((e) => console.error(e));

// brambl1.requests.getBlockByHeight({"height": 3})
// .then((res) => console.log(res))
// .catch((e) => console.error(e));

// const address = brambl1.keyManager.address;

// // const startBlockNumber = 1;
// // const endBlockNumber = 10;

// function logBlockInformation(e) {
//     console.log(" tx type : " + e.txType
//             + " timestamp :" + e.timestamp
//             + " signatures : " + e.signatures
//             + " newBoxes : " + e.newBoxes
//             + " data : " + e.data
//             + " to : " + e.to
//             + " propositionType : " + e.propositionType
//             + " from : " + e.from
//             + " minting : " + e.minting
//             + " txId : " + e.txId
//             + " boxesToRemove : " + e.boxesToRemove
//             + " fee : " + e.fee
//             );
// }

// async function getTransactionsByAddress(address, startBlockNumber, endBlockNumber) {

// // prevent stress on the backend
// let parallelRequests = 15;
// let noOfRequests = (startBlockNumber - endBlockNumber);
// let loopCount = parseInt(noOfRequests/parallelRequests);

// let promiseBuffer = [];
// let allData = [];

// console.log('Searching for transactions to/from address \"' + address + '\ within blocks ' + startBlockNumber + ' and ' + endBlockNumber);
// for (let i = startBlockNumber; i <= endBlockNumber; i++) {
//     console.log("Searching block " + i);
//     promiseBuffer.push(checkAddressInBlockData(i))
// }
// // paused until all promises in buffer are resolved
// return Promise.all(promiseBuffer).then(results => {
//     return results.filter(function(el) {
//         return el != null;
//     })
// });

// }

// function checkAddressInBlockData(height) {
//     return new Promise(resolve => {
//         brambl1.requests.getBlockByHeight({"height":height}).then(res => {
//             if (block != null && block.result != null && block.result.body != null && block.result.body.txs != null) {
//                 block.result.body.txs.forEach( function(e) {
//                 const from = e.from;
//                 const to = e.to;
//                 for (var k in from) {
//                     if (k.hasOwnProperty(address)) {
//                     logBlockInformation(e);
//                     return e;
//                     }
//                 }

//                 for (var k in to) {
//                     if (k.hasOwnProperty(address)) {
//                         logBlockInformation(e);
//                         return e;
//                     }
//                 }
//                     });
//                 }
//             })
//             .then((data) => {
//                 resolve(data)
//             })
//     });
// }

// brambl1.requests.getLatestBlock()
//     .then(res => {console.log(res); return res;})
//     .then(res => {return getTransactionsByAddress(address, res.result.height - 100000, res.result.height);})
//     .then((res) => console.log(res))
//     .catch((e) => console.error(e));

// const routes = require('./src/routes')
// const BramblJS = require('brambljs')
// const mongodb = require('mongodb').MongoClient
// const uri = "mongodb+srv://shoshonte:drMZucT6_sBqG4D@cluster0.s4owu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
// // Allows the use of JSON in our API

// const provider = {
//   url: "https://staging.vertx.topl.services/valhalla/605b5ae853db61085c0110bf",
//   apiKey: "NjJmM2I5MWYtNDhhNy00MWRiLTgwYjEtNTg2NmI2NmYyM2Mw"
// }

// // Initialize brambljs instance for the sender
// var senderBrambljs = new BramblJS({
//     networkPrefix: "valhalla",
//     password: "topl_the_world!",
//     Requests: provider
//   })

// // Initialize brambljs instance for the recipient
// var recipientBrambljs = new BramblJS({
//   networkPrefix: "valhalla",
//   password: "topl_the_world!",
//   Requests: provider
// })

// // Connect to our MongoDB database
// const client = new MongoClient(uri, {useUnifiedTopology: true, useNewUrlPParser:true});

// // Get the address. We are using the default one generated when the brambljs instance was created
// const addresses = [senderBrambljs.keyManager.address, recipientBrambljs.keyManager.address]

// // Call the function and import it from the routes file
// routes(app, db, address)
// // Listen to any attempted connections on port 8082
// app.listen(process.env.PORT || 8082, () => {
//     console.log('listening on port ' + (process.env.PORT || 8082))
//   })
