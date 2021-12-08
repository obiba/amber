// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const logger = require('../logger');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    // verify that study exists
    const studyService = context.app.service('study');
    await studyService.get(context.data.study);
    // verify that form exists and apply schema
    const formService = context.app.service('form');
    const form = await formService.get(context.data.form);
    context.data.schema = form.schema;
    // get last revision
    const formRevisionService = context.app.service('form-revision');
    const result = await formRevisionService.find({
      query: {
        study: context.data.study,
        form: context.data.form,
        $limit: 1,
        $sort: {
          revision: -1
        }
      }
    });
    const latestRevision = result.data && result.data.length > 0 ? result.data[0].revision : 0;
    context.data.revision = latestRevision + 1;
    // Set created by the logged in user
    context.data.publishedBy = context.params.user._id;
    if (!context.data.comment) {
      context.data.comment = `[${context.params.user.email}]`;
    } else {
      context.data.comment = context.data.comment + ` [${context.params.user.email}]`;
    }
    return context;
  };
};
