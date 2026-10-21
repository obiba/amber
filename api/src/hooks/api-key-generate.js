// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const { generateApiKey } = require('../utils/data-api-key');

/**
 * Before create, or patch with `regenerate`: makes a new key, of which only the hash is stored.
 * After: the plain key is returned once (the hash is removed by protect).
 */
// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    if (context.type === 'before') {
      // hook-set fields cannot be provided by the caller
      // eslint-disable-next-line no-unused-vars
      const { hash, prefix, lastUsedAt, regenerate, ...data } = context.data;
      if (context.method === 'create' || regenerate) {
        const { key, hash, prefix } = generateApiKey();
        Object.assign(data, { hash, prefix });
        context.params.apiKeyValue = key;
      }
      context.data = data;
    } else if (context.params.apiKeyValue) {
      context.result.key = context.params.apiKeyValue;
    }
    return context;
  };
};
