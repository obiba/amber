const { MongoDBService } = require('@feathersjs/mongodb');

/**
 * Base class for MongoDB services that provides lazy model loading.
 * This ensures the MongoDB connection is established before any operations.
 */
class LazyMongoDBService extends MongoDBService {
  constructor(options, app, collectionName) {
    super(options);
    this.app = app;
    this.collectionName = collectionName;
  }

  async getModel() {
    if (!this.Model) {
      const db = await this.app.get('mongodbClient');
      this.Model = db.collection(this.collectionName);
    }
    return this.Model;
  }

  async _find(params) {
    await this.getModel();
    return super._find(params);
  }

  async _get(id, params) {
    await this.getModel();
    return super._get(id, params);
  }

  async _create(data, params) {
    await this.getModel();
    return super._create(data, params);
  }

  async _update(id, data, params) {
    await this.getModel();
    return super._update(id, data, params);
  }

  async _patch(id, data, params) {
    await this.getModel();
    return super._patch(id, data, params);
  }

  async _remove(id, params) {
    await this.getModel();
    return super._remove(id, params);
  }
}

module.exports = { LazyMongoDBService };
