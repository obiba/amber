// Initializes the `itwd` service on path `/itwd`
const { Itws } = require('./itwd.class');
const hooks = require('./itwd.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/itwd', new Itws(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('itwd');

  service.hooks(hooks);
};
