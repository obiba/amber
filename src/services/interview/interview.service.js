// Initializes the `interview` service on path `/interview`
const { Interview } = require('./interview.class');
const hooks = require('./interview.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
    multi: ['remove'],
    filters: { $nor: true, $and: true },
    operators: ['$nor', '$and', '$regex']
  };

  // Initialize our service with any options it requires
  app.use('/interview', new Interview(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('interview');

  service.hooks(hooks);
};
