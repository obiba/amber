// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {

    // attempt to remove forms before removing the study
    // will fail if there are associated items (case reports, case report forms, interviews, interview designs)
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
    }  else if (context.params.query) {
      const result = await context.app.service('study').find(context.params);
      for (let id of result.data.map(fr => fr._id.toString())) {
        await removeForms(id);
      }
    }

    return context;
  };
};
