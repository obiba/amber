const { LazyMongoDBService } = require('../mongodb-service.class');

exports.Task = class Task extends LazyMongoDBService {
  constructor(options, app) {
    super(options, app, 'tasks');
  }
};
