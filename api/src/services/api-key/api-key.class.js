const { LazyMongoDBService } = require('../mongodb-service.class');

exports.ApiKey = class ApiKey extends LazyMongoDBService {
  constructor(options, app) {
    super(options, app, 'apikeys');
  }
};
