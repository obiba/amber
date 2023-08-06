// Initializes the `itws` service on path `/itws`
const { Itws } = require('./itws.class');
const hooks = require('./itws.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/itws', new Itws(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('itws');

  service.hooks(hooks);
};
