// Initializes the `group` service on path `/group`
const { Group } = require('./group.class');
const createModel = require('../../models/group.model');
const hooks = require('./group.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: ['remove'],
    whitelist: ['$nor', '$and', '$regex']
  };

  // Initialize our service with any options it requires
  app.use('/group', new Group(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('group');

  service.hooks(hooks);
};
