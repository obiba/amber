const { BadRequest } = require('@feathersjs/errors');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    // verify name is unique in its study
    const itwDesignService = context.app.service('interview-design');
    const q = {
      $limit: 0,
      name: context.data.name,
      study: context.data.study
    };
    const res = await itwDesignService.find({ query: q });
    if (res.total > 0) {
      throw new BadRequest('Interview design name must be unique in the study');
    }
    // Set created by the logged in user
    context.data.createdBy = context.params.user._id;
    return context;
  };
};
