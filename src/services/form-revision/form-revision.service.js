// Initializes the `form-revision` service on path `/form-revision`
const { FormRevision } = require('./form-revision.class');
const hooks = require('./form-revision.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
    multi: ['remove'],
    filters: { $nor: true, $and: true },
    operators: ['$nor', '$and', '$regex']
  };

  // Initialize our service with any options it requires
  app.use('/form-revision', new FormRevision(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('form-revision');

  // Set up MongoDB collection
  app.get('mongodbClient').then(db => {
    service.Model = db.collection('formrevisions');
  });

  service.hooks(hooks);
};
