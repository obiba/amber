// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const { ownerOf } = require('../services/files/files.class');
const { apiKeyOf } = require('../utils/data-api-key');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    const file = context.result;
    await context.app.service('audit').create({
      accessedBy: ownerOf(context.params),
      apiKey: apiKeyOf(context.params),
      service: 'files',
      query: JSON.stringify({ id: context.id }),
      data: {
        fileName: file.filename,
        state: file.metadata.state,
        record: file.metadata.record ? { service: file.metadata.record.service, id: String(file.metadata.record.id) } : undefined
      }
    });
    return context;
  };
};
