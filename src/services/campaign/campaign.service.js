// Initializes the `campaign` service on path `/campaign`
const { Campaign } = require('./campaign.class');
const hooks = require('./campaign.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
    multi: ['remove'],
    filters: { $nor: true, $or: true, $exists: true, $eq: true },
    operators: ['$nor', '$or', '$regex', '$exists', '$eq']
  };

  // Initialize our service with any options it requires
  app.use('/campaign', new Campaign(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('campaign');

  service.hooks(hooks);
};
