const sinon = require("sinon");
const glob = require("glob");
const request = require("supertest");
// global stubs
const globalSandbox = sinon.createSandbox();
const app = require("../../src/app");
app.use(require("body-parser").json());

before(function (done) {
    app.on("appStarted", function () {
        done();
    });
});

// get integration tests
const testModules = glob
    .sync("**/*.integration.js", { cwd: `${process.cwd()}/test/integrationTests` })
    .map((fileName) => {
        return require(`./${fileName}`);
    });

after(() => {
    globalSandbox.restore();
});

//run integration tests
testModules.forEach((module) => {
    module(app, request);
});
