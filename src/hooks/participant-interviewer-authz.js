// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    if (context.params.user && context.params.user.role === 'interviewer') {
      const campaignService = await context.app.service('campaign');
      if (context.result._id) {
        // will fail if campaign is not accessible to interviewer
        await campaignService.get(context.result.campaign);
      } else if (Array.isArray(context.result.data)) {
        const campaignIds = context.result.data
          .map((participant) => participant.campaign.toString())
          .filter((value, index, array) => array.indexOf(value) === index);
        for (const id of campaignIds) {
          await campaignService.get(id);
        }
      }
    }
    return context;
  };
};
