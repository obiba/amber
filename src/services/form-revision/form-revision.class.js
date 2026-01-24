const { LazyMongoDBService } = require('../mongodb-service.class');

exports.FormRevision = class FormRevision extends LazyMongoDBService {
  constructor(options, app) {
    super(options, app, 'formrevisions');
  }
};
