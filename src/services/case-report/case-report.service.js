// Initializes the `case-report` service on path `/case-report`
const { CaseReport } = require('./case-report.class');
const createModel = require('../../models/case-report.model');
const hooks = require('./case-report.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: ['remove'],
    whitelist: ['$nor', '$and', '$regex']
  };

  // Initialize our service with any options it requires
  app.use('/case-report', new CaseReport(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('case-report');

  service.hooks(hooks);
};
