const { LazyMongoDBService } = require('../mongodb-service.class');

exports.Campaign = class Campaign extends LazyMongoDBService {
  constructor(options, app) {
    super(options, app, 'campaigns');
  }
};
