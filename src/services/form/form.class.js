const { LazyMongoDBService } = require('../mongodb-service.class');

exports.Form = class Form extends LazyMongoDBService {
  constructor(options, app) {
    super(options, app, 'forms');
  }
};
