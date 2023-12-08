// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {

    // attempt to remove form campaigns before removing the interview design
    // will remove also associated participants
    const removeCampaigns = async (id) => {
      const result = await context.app.service('campaign').find({
        query: {
          interviewDesign: id,
          $select: [ '_id' ]
        }
      });
      const params = {
        query: {
          _id: {
            $in: result.data.map(fr => fr._id.toString())
          }
        }
      };
      await context.app.service('campaign').remove(null, params);
    };

    if (context.id) {
      await removeCampaigns(context.id);
    }  else if (context.params.query) {
      const result = await context.app.service('interview-design').find(context.params);
      for (let id of result.data.map(fr => fr._id.toString())) {
        await removeCampaigns(id);
      }
    }

    return context;
  };
};
