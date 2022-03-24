// Initializes the `audit` service on path `/audit`
const { Audit } = require('./audit.class');
const createModel = require('../../models/audit.model');
const hooks = require('./audit.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/audit', new Audit(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('audit');

  service.hooks(hooks);
};
