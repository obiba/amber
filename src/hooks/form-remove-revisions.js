// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    const formRevisionService = context.app.service('form-revision');

    // remove forms associated to the removed study
    const removeFormRevisions = (form) => {
      formRevisionService.find({ query: { form: form._id } })
        .then(revisions => {
          if (revisions.total>0) {
            revisions.data.forEach(rev => formRevisionService.remove(rev._id));
          }
        })
        .catch(err => console.log(err));
    };

    if (Array.isArray(context.result)) {
      context.result.forEach(form => {
        removeFormRevisions(form);
      });
    } else {
      removeFormRevisions(context.result);
    }

    return context;
  };
};
