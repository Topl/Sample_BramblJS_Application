module.exports = async function() {
    console.log("Teardown Mongo Connection")
    delete global.toplClient
    delete global.toplDB
}