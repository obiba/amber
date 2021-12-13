// Initializes the `form-revision-digest` service on path `/form-revision-digest`
const { FormRevisionDigest } = require('./form-revision-digest.class');
const hooks = require('./form-revision-digest.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/form-revision-digest', new FormRevisionDigest(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('form-revision-digest');

  service.hooks(hooks);
};
