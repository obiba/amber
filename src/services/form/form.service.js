// Initializes the `form` service on path `/form`
const { Form } = require('./form.class');
const hooks = require('./form.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
    multi: ['remove'],
    filters: { $nor: true, $and: true },
    operators: ['$nor', '$and', '$regex']
  };

  // Initialize our service with any options it requires
  app.use('/form', new Form(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('form');

  // Set up MongoDB collection
  app.get('mongodbClient').then(db => {
    service.Model = db.collection('forms');
  });

  service.hooks(hooks);
};
