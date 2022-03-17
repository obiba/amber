// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {

    // remove case report forms before removing the form
    if (context.id) {
      context.app.service('case-report-form').remove(null, {
        query: {
          form: context.id
        }
      });
    } else if (context.params.query) {
      await context.app.service('form').find(context.params)
        .then(result => {
          for (let form of result.data) {
            context.app.service('case-report-form').remove(null, {
              query: {
                form: form._id.toString()
              }
            });
          }
        });
    }

    return context;
  };
};
