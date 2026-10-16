const { LazyMongoDBService } = require('../mongodb-service.class');

exports.CaseReport = class CaseReport extends LazyMongoDBService {
  constructor(options, app) {
    super(options, app, 'casereports');
  }
};
