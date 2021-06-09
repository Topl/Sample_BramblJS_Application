module.exports = (failureConditions, request, app) => {
  switch (failureConditions.method) {
    case "post":
      failureConditions.conditions.forEach(condition => {
        it(condition.description, function(done) {
          request(app)
            .post(failureConditions.route)
            .send(condition.args)
            .expect(condition.code, done);
        });
      });
      break;
    case "get":
      break;
    case "patch":
      break;
    case "delete":
      break;
  }
};
