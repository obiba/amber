// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const allowApiKey = require('./allow-api-key');

/**
 * Authenticate with a data extraction API key, from the `x-api-key` header.
 */
// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => allowApiKey({ strategy: 'dataApiKey', header: 'x-api-key' });
