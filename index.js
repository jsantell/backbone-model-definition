var SchemaModel = require("mongoose-schema-model");

function keys (obj) {
  var k = [];
  for (var key in obj) k.push(key);
  return k;
}

function eachKey (obj, fn) {
  for (var key in obj)
    fn(key, obj[key]);
}

function extend (obj, src) {
  for (var prop in src)
    obj[prop] = src[prop];
  return obj;
}

function executeSet (schemaModel, attrs, context) {
  var results = { values: {}, errors: {} };
  eachKey(attrs, function (key, value) {
    var setResults = schemaModel.set(key, value, context);
    results.values[key] = setResults.value;
    if (setResults.error)
      results.errors[key] = setResults.error;
  });
  return results;
}

module.exports = function ModelMixin (ModelPrototype, schema, options) {
  var schemaModel = SchemaModel(schema, options);
  var BaseGet = ModelPrototype.get;
  var BaseSet = ModelPrototype.set;

  return {
    get: function (prop) {
      return schemaModel.get(prop, BaseGet.call(this, prop));
    },

    set: function (key, value, options) {
      var attrs;

      if (typeof key === "object") {
        attrs = key;
        options = value;
      } else {
        (attrs = {})[key] = value;
      }
      options = options || {};

      var results = executeSet(schemaModel, attrs, this);

      if (options.validate && keys(results.errors).length) {
        this.validationError = results.errors;
        this.trigger("invalid", this, results.errors, extend(options, { validationError: results.errors}));
        return false;
      } else {
        return BaseSet.call(this, results.values, options);
      }
    },

    validate: function (attributes, options) {
      var results = executeSet(schemaModel, attributes, this);
      if (keys(results.errors).length) {
        this.validationError = results.errors;
        this.trigger("invalid", this, results.errors, extend(options, { validationError: results.errors}));
        return results.errors;
      }
    }
  };
};
