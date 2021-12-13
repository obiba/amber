// Initializes the `crfs` service on path `/crfs`
const { Crfs } = require('./crfs.class');
const hooks = require('./crfs.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/crfs', new Crfs(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('crfs');

  service.hooks(hooks);
};
