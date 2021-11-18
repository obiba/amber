// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    const formService = context.app.service('form');

    // remove forms associated to the removed study
    const removeStudyForms = (study) => {
      formService.find({ query: { study: study._id } })
        .then(forms => {
          if (forms.total>0) {
            forms.data.forEach(form => formService.remove(form._id));
          }
        })
        .catch(err => console.log(err));
    };

    if (Array.isArray(context.result)) {
      context.result.forEach(study => {
        removeStudyForms(study);
      });
    } else {
      removeStudyForms(context.result);
    }

    return context;
  };
};
