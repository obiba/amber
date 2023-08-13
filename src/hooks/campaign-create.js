const { BadRequest } = require('@feathersjs/errors');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    // verify that study exists
    const itwDesignService = context.app.service('interview-design');
    const interviewDesign = await itwDesignService.get(context.data.interviewDesign);
    context.data.study = interviewDesign.study;
    // verify name is unique in its study
    const campaignService = context.app.service('campaign');
    const q = {
      $limit: 0,
      name: context.data.name,
      interviewDesign: context.data.interviewDesign
    };
    const res = await campaignService.find({ query: q });
    if (res.total > 0) {
      throw new BadRequest('Campaign name must be unique in its interview design');
    }
    // Set created by the logged in user
    context.data.createdBy = context.params.user._id;
    return context;
  };
};
