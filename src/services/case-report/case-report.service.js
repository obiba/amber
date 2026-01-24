// Initializes the `case-report` service on path `/case-report`
const { CaseReport } = require('./case-report.class');
const hooks = require('./case-report.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
    multi: ['remove'],
    filters: { $nor: true, $and: true },
    operators: ['$nor', '$and', '$regex']
  };

  // Initialize our service with any options it requires
  app.use('/case-report', new CaseReport(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('case-report');

  // Set up MongoDB collection
  app.get('mongodbClient').then(db => {
    service.Model = db.collection('casereports');
  });

  service.hooks(hooks);
};
