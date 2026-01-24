const { LazyMongoDBService } = require('../mongodb-service.class');

exports.CaseReportForm = class CaseReportForm extends LazyMongoDBService {
  constructor(options, app) {
    super(options, app, 'casereportforms');
  }
};
