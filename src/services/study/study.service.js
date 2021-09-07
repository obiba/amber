// Initializes the `study` service on path `/study`
const { Study } = require('./study.class');
const hooks = require('./study.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/study', new Study(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('study');

  service.hooks(hooks);
};
