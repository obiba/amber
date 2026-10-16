const { LazyMongoDBService } = require('../mongodb-service.class');

exports.Group = class Group extends LazyMongoDBService {
  constructor(options, app) {
    super(options, app, 'groups');
  }
};
