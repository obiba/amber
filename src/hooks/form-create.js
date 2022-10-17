const { BadRequest } = require('@feathersjs/errors');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    // verify that study exists
    const studyService = context.app.service('study');
    await studyService.get(context.data.study);
    // verify name is unique in its study
    const formService = context.app.service('form');
    const q = {
      $limit: 0,
      name: context.data.name,
      study: context.data.study
    };
    const res = await formService.find({ query: q });
    if (res.total > 0) {
      throw new BadRequest('Form name must be unique in the study');
    }
    // Set created by the logged in user
    context.data.createdBy = context.params.user._id;
    return context;
  };
};
