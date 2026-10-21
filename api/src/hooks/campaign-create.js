const { BadRequest, Forbidden } = require('@feathersjs/errors');
const { inScope } = require('../utils/data-api-key');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    // verify that study exists
    const itwDesignService = context.app.service('interview-design');
    const interviewDesign = await itwDesignService.get(context.data.interviewDesign);
    // out of scope API key must not learn about other studies' campaign names
    if (context.params.dataApiKey && !inScope(context.params.dataApiKey, interviewDesign.study)) {
      throw new Forbidden();
    }
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
    return context;
  };
};
