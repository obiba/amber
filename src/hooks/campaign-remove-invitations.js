// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {

    // attempt to remove invitations before removing the campaign
    const removeInvitations = async (id) => {
      const invitationsResult = await context.app.service('invitation').find({
        query: {
          campaign: id,
          $select: [ '_id' ]
        }
      });
      const params = {
        query: {
          _id: {
            $in: invitationsResult.data.map(inv => inv._id.toString())
          }
        }
      };
      await context.app.service('invitation').remove(null, params);
    };

    if (context.id) {
      await removeInvitations(context.id);
    }  else if (context.params.query._id && context.params.query._id.$in) {
      for (let id of context.params.query._id.$in) {
        await removeInvitations(id);
      }
    }

    return context;
  };
};
