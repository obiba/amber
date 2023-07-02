// Initializes the `invitation` service on path `/invitation`
const { Invitation } = require('./invitation.class');
const createModel = require('../../models/invitation.model');
const hooks = require('./invitation.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/invitation', new Invitation(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('invitation');

  service.hooks(hooks);
};
