// Initializes the `interview-forms` service on path `/interview-forms`
const { InterviewForms } = require('./interview-forms.class');
const createModel = require('../../models/interview-forms.model');
const hooks = require('./interview-forms.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: ['remove'],
    whitelist: ['$nor', '$or', '$regex', '$exists', '$eq']
  };

  // Initialize our service with any options it requires
  app.use('/interview-forms', new InterviewForms(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('interview-forms');

  service.hooks(hooks);
};
