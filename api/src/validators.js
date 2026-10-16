const { Ajv } = require('@feathersjs/schema');
const { keywordObjectId } = require('@feathersjs/mongodb');

// Data validator - strict validation
const dataValidator = new Ajv({
  allErrors: true,
  useDefaults: true
});
dataValidator.addKeyword(keywordObjectId);

// Query validator - with type coercion for query strings
const queryValidator = new Ajv({
  coerceTypes: true,
  allErrors: true
});
queryValidator.addKeyword(keywordObjectId);

module.exports = { dataValidator, queryValidator };
