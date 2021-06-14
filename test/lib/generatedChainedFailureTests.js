function createTestCallback(method, testRequestConfig) {
    const callback = function (request, app, done) {
        //select appropriate http method
        let response = request(app);
        switch (method) {
            case "get":
                response = response.get(testRequestConfig.route);
                break;
            case "post":
                response = response.post(testRequestConfig.route);
                break;
            case "patch":
                response = response.patch(testRequestConfig.route);
                break;
            case "delete":
                response = response.delete(testRequestConfig.route);
                break;
        }

        // send request with arguments if arguments present
        if (testRequestConfig.staticArgs) {
            response.send(testRequestConfig.staticArgs).expect(testRequestConfig.code, done);
        } else {
            response.send().expect(testRequestConfig.code).end(done);
        }
    };
    return callback;
}

function createIntegrationCallback(fireLastRequest, integrationRequestConfig) {
    const callback = function (request, app, done) {
        let response = request(app);
        switch (integrationRequestConfig.method) {
            case "get":
                response = response.get(integrationRequestConfig.route);
                break;
            case "post":
                response = response.post(integrationRequestConfig.route);
                break;
            case "patch":
                response = response.patch(integrationRequestConfig.route);
                break;
        }

        // send request with arguments if arguments present
        if (integrationRequestConfig.staticArgs) {
            response
                .send(integrationRequestConfig.staticArgs)
                .expect(integrationRequestConfig.code)
                .end(() => {
                    fireLastRequest(request, app, done);
                });
        } else {
            response
                .send()
                .expect(integrationRequestConfig.code)
                .end(() => {
                    fireLastRequest(request, app, done);
                });
        }
    };
    return callback;
}

function fireChainedRequests(request, app, done, callback, firstRequest) {
    let req = request(app);
    //select appropriate http method
    switch (firstRequest.method) {
        case "get":
            req = req.get(firstRequest.route);
            break;
        case "post":
            req = req.post(firstRequest.route);
            break;
        case "patch":
            req = req.patch(firstRequest.route);
            break;
    }

    // send request with arguments if arguments are present
    if (firstRequest.staticArgs) {
        req.send(firstRequest, firstRequest.staticArgs)
            .expect(200)
            .end(() => {
                callback(request, app, done);
            });
    } else {
        req.send()
            .expect(200)
            .end(() => {
                callback(request, app, done);
            });
    }
}

module.exports = (failureConditions, request, app) => {
    const integrationRequests = failureConditions.integrationRequests;

    failureConditions.testRequest.testConfig.forEach((finalRequest) => {
        it(finalRequest.description, function (done) {
            const integrationTestNumber = integrationRequests.length;

            //generate final callback
            let callback = createTestCallback(failureConditions.testRequest.method, finalRequest);

            //generate integration callbacks in reverse order
            integrationRequests
                .slice()
                .reverse()
                .forEach((intRequest, index) => {
                    //if not final request in array (first request that is needed to fire)
                    if (index < integrationTestNumber - 1) {
                        callback = createIntegrationCallback(callback, intRequest);
                    }
                });
            // fire requests
            fireChainedRequests(request, app, done, callback, integrationRequests[0]);
        });
    });
};
