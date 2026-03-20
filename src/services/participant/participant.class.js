const { LazyMongoDBService } = require('../mongodb-service.class');

exports.Participant = class Participant extends LazyMongoDBService {
  constructor(options, app) {
    super(options, app, 'participants');
  }
};
