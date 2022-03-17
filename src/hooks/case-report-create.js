// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    // Get CRF
    if (context.data.crfId) {
      const crfService = context.app.service('case-report-form');
      const crf = await crfService.get(context.data.crfId);
      context.data.study = crf.study;
      context.data.form = crf.form;
    }
    delete context.data.id;
    // Set created by the logged in user
    context.data.createdBy = context.params.user._id;
    return context;
  };
};
