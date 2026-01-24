// Initializes the `group` service on path `/group`
const { Group } = require('./group.class');
const hooks = require('./group.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
    multi: ['remove'],
    filters: { $nor: true, $and: true },
    operators: ['$nor', '$and', '$regex']
  };

  // Initialize our service with any options it requires
  app.use('/group', new Group(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('group');

  service.hooks(hooks);
};
