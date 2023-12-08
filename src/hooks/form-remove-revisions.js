// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    
    // attempt to remove form revisions before removing the form
    // will fail if there are associated case reports
    const removeFormRevisions = async (id) => {
      const formRevisionsResult = await context.app.service('form-revision').find({
        query: {
          form: id,
          $select: [ '_id' ]
        }
      });
      const params = {
        query: {
          _id: {
            $in: formRevisionsResult.data.map(fr => fr._id.toString())
          }
        }
      };
      await context.app.service('form-revision').remove(null, params);
    };

    if (context.id) {
      await removeFormRevisions(context.id);
    }  else if (context.params.query) {
      const result = await context.app.service('form').find(context.params);
      for (let id of result.data.map(fr => fr._id.toString())) {
        await removeFormRevisions(id);
      }
    }

    return context;
  };
};
