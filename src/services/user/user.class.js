const { LazyMongoDBService } = require('../mongodb-service.class');

exports.User = class User extends LazyMongoDBService {
  constructor(options, app) {
    super(options, app, 'users');
  }
};
