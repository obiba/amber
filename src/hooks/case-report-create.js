// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const { BadRequest } = require('@feathersjs/errors');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    // Get CRF
    if (context.data.crfId) {
      const crfService = context.app.service('case-report-form');
      const crf = await crfService.get(context.data.crfId);
      context.data.caseReportForm = context.data.crfId;
      context.data.study = crf.study;
      context.data.form = crf.form;
      const policy = crf.repeatPolicy ? crf.repeatPolicy : 'multiple';
      if (policy !== 'multiple') {
        const crService = context.app.service('case-report');
        const crs = await crService.find({
          query: {
            $limit: 1,
            caseReportForm: context.data.caseReportForm,
            'data._id': context.data.data._id
          }
        });
        if (crs.total > 0) {
          if (policy === 'single_reject') {
            throw new BadRequest('There is already a Case Report with ID ' + context.data.data._id);
          } else {
            await crService.remove(crs.data[0]._id);
          }
        }
      }
    } else {
      throw new BadRequest('Case report form is missing');
    }
    delete context.data.id;
    // Set created by the logged in user
    context.data.createdBy = context.params.user._id;
    return context;
  };
};
