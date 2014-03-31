var _ = require("underscore");
var SchemaModel = require("mongoose-schema-model");

function executeSet (schemaModel, attrs, context) {
  return _.reduce(attrs, function (results, value, key) {
    var setResults = schemaModel.set(key, value, context);
    results.values[key] = setResults.value;
    if (setResults.error)
      results.errors[key] = setResults.error;
    return results;
  }, { values: {}, errors: {}});
}

module.exports = function ModelMixin (ModelPrototype, schema, options) {
  var schemaModel = SchemaModel(schema, options);
  var BaseGet = ModelPrototype.get;
  var BaseSet = ModelPrototype.set;

  return BackboneModel.extend({
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

      if (options.validate && _.keys(results.errors).length) {
        this.validationError = results.errors;
        this.trigger("invalid", this, results.errors, _.extend(options, { validationError: results.errors}));
        return false;
      } else {
        return BaseSet.call(this, results.values, options);
      }
    },

    validate: function (attributes, options) {
      var results = executeSet(schemaModel, attributes, this);
      if (_.keys(results.errors).length) {
        this.validationError = results.errors;
        this.trigger("invalid", this, results.errors, _.extend(options, { validationError: results.errors}));
        return results.errors;
      }
    }
  });
};
