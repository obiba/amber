const { LazyMongoDBService } = require('../mongodb-service.class');

exports.ApiKey = class ApiKey extends LazyMongoDBService {
  constructor(options, app) {
    super(options, app, 'apikeys');
  }

  // every data API key authentication looks up the key by its hash
  async getModel() {
    if (!this.Model) {
      await super.getModel();
      await this.Model.createIndex({ hash: 1 }, { unique: true });
    }
    return this.Model;
  }
};
