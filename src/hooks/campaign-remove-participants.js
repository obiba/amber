// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {

    // attempt to remove participants before removing the campaign
    const removeParticipants = async (id) => {
      const participantsResult = await context.app.service('participant').find({
        query: {
          campaign: id,
          $select: [ '_id' ]
        }
      });
      const params = {
        query: {
          _id: {
            $in: participantsResult.data.map(inv => inv._id.toString())
          }
        }
      };
      await context.app.service('participant').remove(null, params);
    };

    if (context.id) {
      await removeParticipants(context.id);
    }  else if (context.params.query._id && context.params.query._id.$in) {
      for (let id of context.params.query._id.$in) {
        await removeParticipants(id);
      }
    }

    return context;
  };
};
