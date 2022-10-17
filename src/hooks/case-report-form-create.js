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
    let q = {
      $limit: 0,
      study: context.data.study,
      form: context.data.form
    };
    if (context.data.revision) {
      q.revision = context.data.revision;
    }
    let res = await formRevisionService.find({ query: q });
    if (res.total === 0) {
      throw new BadRequest('Bad form revision');
    }
    // verify name is unique in its study
    const crfService = context.app.service('case-report-form');
    q = {
      $limit: 0,
      name: context.data.name,
      study: context.data.study
    };
    res = await crfService.find({ query: q });
    if (res.total > 0) {
      throw new BadRequest('Case report form name must be unique in the study');
    }
    // Set created by the logged in user
    context.data.createdBy = context.params.user._id;
    return context;
  };
};
