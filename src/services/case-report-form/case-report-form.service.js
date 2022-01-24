// Initializes the `case-report` service on path `/case-report`
const { CaseReportForm } = require('./case-report-form.class');
const createModel = require('../../models/case-report-form.model');
const hooks = require('./case-report-form.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: ['remove'],
    whitelist: ['$nor', '$or', '$regex', '$exists', '$eq']
  };

  // Initialize our service with any options it requires
  app.use('/case-report-form', new CaseReportForm(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('case-report-form');

  service.hooks(hooks);
};
