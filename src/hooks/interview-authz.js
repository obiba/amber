// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    if (context.params.user && context.params.user.role === 'interviewer') {
      // restrict to interviews for which user is an investigator or a supporter
      const campaigns = await context.app.service('campaign').find(
        {
          query: {
            $or: [ { investigators: context.params.user._id }, { supporters: context.params.user._id }]
          }
        });
      const campaignIds = campaigns.data.map(c => c._id);
      let campaignCriteria = { $in: campaignIds };
      if (context.params.query.campaign) {
        context.params.query = { ...context.params.query, $and: [
          { campaign: campaignCriteria }, 
          { campaign: context.params.query.campaign }
        ] };
      } else {
        context.params.query = { ...context.params.query, campaign: campaignCriteria };
      }
      
    }
    return context;
  };
};
