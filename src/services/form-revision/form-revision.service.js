// Initializes the `form-revision` service on path `/form-revision`
const { FormRevision } = require('./form-revision.class');
const createModel = require('../../models/form-revision.model');
const hooks = require('./form-revision.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: ['remove'],
    whitelist: ['$nor', '$and', '$regex']
  };

  // Initialize our service with any options it requires
  app.use('/form-revision', new FormRevision(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('form-revision');

  service.hooks(hooks);
};
