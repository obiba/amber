const { MongoDBService } = require('@feathersjs/mongodb');
const { ObjectId } = require('mongodb');

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

  filterQuery(id, params) {
    const result = super.filterQuery(id, params);
    const idField = this.id;
    const queryId = result.query[idField];
    if (queryId !== null && queryId !== undefined && typeof queryId === 'object' && !(queryId instanceof ObjectId)) {
      const converted = { ...queryId };
      let changed = false;
      if (Array.isArray(queryId.$in)) {
        converted.$in = queryId.$in.map(v => this.getObjectId(v));
        changed = true;
      }
      if (Array.isArray(queryId.$nin)) {
        converted.$nin = queryId.$nin.map(v => this.getObjectId(v));
        changed = true;
      }
      if (queryId.$ne !== undefined) {
        converted.$ne = this.getObjectId(queryId.$ne);
        changed = true;
      }
      if (changed) {
        result.query[idField] = converted;
      }
    }
    return result;
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
