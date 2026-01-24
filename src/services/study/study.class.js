const { LazyMongoDBService } = require('../mongodb-service.class');

exports.Study = class Study extends LazyMongoDBService {
  constructor(options, app) {
    super(options, app, 'studies');
  }
};
