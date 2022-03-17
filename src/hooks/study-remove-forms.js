// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {

    // attempt to remove forms before removing the study
    // will fail if there are associated case reports
    const removeForms = async (id) => {
      const formResult = await context.app.service('form').find({
        query: {
          study: id,
          $select: [ '_id' ]
        }
      });
      const params = {
        query: {
          _id: {
            $in: formResult.data.map(fr => fr._id.toString())
          }
        }
      };
      await context.app.service('form').remove(null, params);
    };

    if (context.id) {
      await removeForms(context.id);
    }  else if (context.params.query._id && context.params.query._id.$in) {
      for (let id of context.params.query._id.$in) {
        await removeForms(id);
      }
    }

    return context;
  };
};
