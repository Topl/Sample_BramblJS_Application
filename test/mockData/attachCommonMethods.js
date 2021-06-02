module.exports = function(mockDocument) {
  mockDocument.save = function() {
    return Promise.resolve("mockSave");
  };

  mockDocument.markModified = function() {
    return Promise.resolve("mockMarkModified");
  };

  mockDocument.toJSON = function() {
    return mockDocument;
  };

  return mockDocument;
};
