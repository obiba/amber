// Initializes the `itw` service on path `/itw`
const { Itw } = require('./itw.class');
const hooks = require('./itw.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/itw', new Itw(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('itw');

  service.hooks(hooks);
};
