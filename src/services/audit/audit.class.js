const { LazyMongoDBService } = require('../mongodb-service.class');

exports.Audit = class Audit extends LazyMongoDBService {
  constructor(options, app) {
    super(options, app, 'audits');
  }
};
