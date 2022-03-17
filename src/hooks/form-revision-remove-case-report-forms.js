// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {

    // remove case report forms before removing the form revision
    if (context.id) {
      context.app.service('form-revision').get(context.id)
        .then(formRevision => {
          context.app.service('case-report-form').remove(null, {
            query: {
              form: formRevision.form.toString(),
              revision: formRevision.revision
            }
          });
        });
      
    } else if (context.params.query) {
      await context.app.service('form-revision').find(context.params)
        .then(result => {
          for (let formRevision of result.data) {
            context.app.service('case-report-form').remove(null, {
              query: {
                form: formRevision.form.toString(),
                revision: formRevision.revision
              }
            });
          }
        });
    }

    return context;
  };
};
