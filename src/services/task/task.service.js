// Initializes the `task` service on path `/task`
const { Task } = require('./task.class');
const hooks = require('./task.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
    multi: ['remove'],
    filters: { $nor: true, $and: true, $ne: true },
    operators: ['$nor', '$and', '$regex', '$ne']
  };

  // Initialize our service with any options it requires
  app.use('/task', new Task(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('task');

  // Set up MongoDB collection
  app.get('mongodbClient').then(db => {
    service.Model = db.collection('tasks');
  });

  service.hooks(hooks);
};
