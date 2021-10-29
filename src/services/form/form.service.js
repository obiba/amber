// Initializes the `form` service on path `/form`
const { Form } = require('./form.class');
const createModel = require('../../models/form.model');
const hooks = require('./form.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: ['remove'],
    whitelist: ['$nor', '$and', '$regex']
  };

  // Initialize our service with any options it requires
  app.use('/form', new Form(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('form');

  service.hooks(hooks);
};
