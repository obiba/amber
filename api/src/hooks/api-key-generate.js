// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const { generateApiKey } = require('../utils/data-api-key');

/**
 * Before create, or patch with `regenerate`: makes a new key, of which only the hash is stored.
 * After: the plain key is returned once, the hash never.
 */
// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    if (context.type === 'before') {
      if (context.method === 'create' || context.data.regenerate) {
        const { key, hash, prefix } = generateApiKey();
        context.data = { ...context.data, hash, prefix };
        context.params.apiKeyValue = key;
      }
      delete context.data.regenerate;
      return context;
    }
    const strip = (item) => {
      // eslint-disable-next-line no-unused-vars
      const { hash, ...rest } = item;
      return rest;
    };
    if (Array.isArray(context.result)) {
      context.result = context.result.map(strip);
    } else if (context.result.data) {
      context.result.data = context.result.data.map(strip);
    } else {
      context.result = strip(context.result);
      if (context.params.apiKeyValue) {
        context.result.key = context.params.apiKeyValue;
      }
    }
    return context;
  };
};
