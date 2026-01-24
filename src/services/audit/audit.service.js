// Initializes the `audit` service on path `/audit`
const { Audit } = require('./audit.class');
const hooks = require('./audit.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/audit', new Audit(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('audit');

  // Set up MongoDB collection
  app.get('mongodbClient').then(db => {
    service.Model = db.collection('audits');
  });

  service.hooks(hooks);
};
