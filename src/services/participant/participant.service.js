// Initializes the `participant` service on path `/participant`
const { Participant } = require('./participant.class');
const createModel = require('../../models/participant.model');
const hooks = require('./participant.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: ['remove'],
    whitelist: ['$nor', '$or', '$regex', '$exists', '$eq']
  };

  // Initialize our service with any options it requires
  app.use('/participant', new Participant(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('participant');

  service.hooks(hooks);
};
