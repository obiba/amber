// Initializes the `interview-design` service on path `/interview-design`
const { InterviewDesigns } = require('./interview-design.class');
const hooks = require('./interview-design.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
    multi: ['remove'],
    filters: { $nor: true, $or: true, $exists: true, $eq: true },
    operators: ['$nor', '$or', '$regex', '$exists', '$eq']
  };

  // Initialize our service with any options it requires
  app.use('/interview-design', new InterviewDesigns(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('interview-design');

  service.hooks(hooks);
};
