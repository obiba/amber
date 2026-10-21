// Initializes the `api-key` service on path `/api-key`
const { ApiKey } = require('./api-key.class');
const hooks = require('./api-key.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
    filters: { $nor: true, $and: true },
    operators: ['$nor', '$and', '$regex']
  };

  // Initialize our service with any options it requires
  app.use('/api-key', new ApiKey(options, app), {
    // no update: a replacement would drop the key hash
    methods: ['find', 'get', 'create', 'patch', 'remove']
  });

  // Get our initialized service so that we can register hooks
  const service = app.service('api-key');

  service.hooks(hooks);
};
