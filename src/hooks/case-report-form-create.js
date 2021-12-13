const { BadRequest } = require('@feathersjs/errors');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    // verify that study exists
    const studyService = context.app.service('study');
    await studyService.get(context.data.study);
    // verify that form exists
    const formService = context.app.service('form');
    await formService.get(context.data.form);
    // verify that form exists
    const formRevisionService = context.app.service('form-revision');
    const q = {
      $limit: 0,
      study: context.data.study,
      form: context.data.form
    };
    if (context.data.revision) {
      q.revision = context.data.revision;
    }
    const revisions = await formRevisionService.find({
      query: q
    });
    if (revisions.total === 0) {
      throw new BadRequest('No form revision');
    }
    // Set created by the logged in user
    context.data.createdBy = context.params.user._id;
    return context;
  };
};
