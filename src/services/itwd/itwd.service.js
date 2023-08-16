// Initializes the `itwd` service on path `/itwd`
const { Itwd } = require('./itwd.class');
const hooks = require('./itwd.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/itwd', new Itwd(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('itwd');

  service.hooks(hooks);
};
