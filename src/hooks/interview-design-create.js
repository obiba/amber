const { BadRequest } = require('@feathersjs/errors');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    // verify that study exists
    const studyService = context.app.service('study');
    await studyService.get(context.data.study);
    // verify that form (with revision) exist
    const formRevisionService = context.app.service('form-revision');
    if (context.data.steps) {
      for (const step of context.data.steps) {
        // verify that form exists
        const q = {
          $limit: 0,
          study: context.data.study,
          form: step.form
        };
        if (step.revision) {
          q.revision = step.revision;
        }
        const res = await formRevisionService.find({ query: q });
        if (res.total === 0) {
          throw new BadRequest('Bad form revision');
        }
      }
    }
    // verify name is unique in its study
    const itwDesignService = context.app.service('interview-design');
    const q = {
      $limit: 0,
      name: context.data.name,
      study: context.data.study
    };
    const res = await itwDesignService.find({ query: q });
    if (res.total > 0) {
      throw new BadRequest('Interview form name must be unique in the study');
    }
    // Set created by the logged in user
    context.data.createdBy = context.params.user._id;
    return context;
  };
};
