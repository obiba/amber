// Initializes the `case-report-form` service on path `/case-report-form`
const { CaseReportForm } = require('./case-report-form.class');
const hooks = require('./case-report-form.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
    multi: ['remove'],
    filters: { $nor: true, $or: true, $exists: true, $eq: true },
    operators: ['$nor', '$or', '$regex', '$exists', '$eq']
  };

  // Initialize our service with any options it requires
  app.use('/case-report-form', new CaseReportForm(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('case-report-form');

  // Set up MongoDB collection
  app.get('mongodbClient').then(db => {
    service.Model = db.collection('casereportforms');
  });

  service.hooks(hooks);
};
