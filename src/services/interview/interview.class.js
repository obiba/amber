const { LazyMongoDBService } = require('../mongodb-service.class');

exports.Interview = class Interview extends LazyMongoDBService {
  constructor(options, app) {
    super(options, app, 'interviews');
  }
};
