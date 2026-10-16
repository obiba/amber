const { LazyMongoDBService } = require('../mongodb-service.class');

exports.InterviewDesigns = class InterviewDesigns extends LazyMongoDBService {
  constructor(options, app) {
    super(options, app, 'interviewdesigns');
  }
};
