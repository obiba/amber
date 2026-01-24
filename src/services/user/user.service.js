// Initializes the `user` service on path `/user`
const { User } = require('./user.class');
const hooks = require('./user.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
    multi: ['remove'],
    filters: { $nor: true, $and: true },
    operators: ['$nor', '$and', '$regex']
  };

  // Initialize our service with any options it requires
  app.use('/user', new User(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('user');

  // Set up MongoDB collection
  app.get('mongodbClient').then(db => {
    service.Model = db.collection('users');
  });

  service.hooks(hooks);
};
