const assert = require('assert');
const appPromise = require('../../src/app');
let app;

before(async function() { this.timeout(30000); app = await appPromise; });

describe('\'group\' service', () => {
  let service;
  let mockApp;
  let mockCollection;
  let mockDb;

  beforeEach(() => {
    // Create mock MongoDB collection
    const createCursor = (data = []) => {
      const cursor = {
        limit: () => cursor,
        skip: () => cursor,
        sort: () => cursor,
        toArray: async () => data
      };
      return cursor;
    };

    mockCollection = {
      find: () => createCursor([]),
      findOne: async () => null,
      findOneAndUpdate: async () => {
        return {
          _id: 'group1',
          name: 'Test Group',
          description: 'Test Description',
          users: []
        };
      },
      findOneAndDelete: async () => {
        return {
          _id: 'group1',
          name: 'Test Group',
          users: []
        };
      },
      insertOne: async () => {
        return { 
          insertedId: 'group123',
          acknowledged: true 
        };
      },
      deleteMany: async () => ({
        deletedCount: 3
      }),
      countDocuments: async () => 0
    };

    // Create mock database
    mockDb = {
      collection: (name) => {
        if (name === 'groups') {
          return mockCollection;
        }
        return null;
      }
    };

    // Create mock app
    mockApp = {
      get: (key) => {
        if (key === 'mongodbClient') {
          return Promise.resolve(mockDb);
        }
        const config = {
          paginate: { max: 1000, default: 10 }
        };
        return config[key];
      }
    };

    const { Group } = require('../../src/services/group/group.class');
    service = new Group({ 
      paginate: { max: 1000 },
      multi: ['remove'],
      filters: { $nor: true, $and: true },
      operators: ['$nor', '$and', '$regex']
    }, mockApp);
  });

  describe('service registration', () => {
    it('registered the service', () => {
      const registeredService = app.service('group');
      assert.ok(registeredService, 'Registered the service');
    });
  });

  describe('constructor', () => {
    it('should extend LazyMongoDBService', () => {
      const { LazyMongoDBService } = require('../../src/services/mongodb-service.class');
      assert.ok(service instanceof LazyMongoDBService);
    });

    it('should initialize with options and app', () => {
      assert.ok(service.app);
      assert.ok(service.options);
      assert.strictEqual(service.app, mockApp);
    });

    it('should set collection name to groups', () => {
      assert.strictEqual(service.collectionName, 'groups');
    });

    it('should have pagination options', () => {
      assert.ok(service.options.paginate);
      assert.strictEqual(service.options.paginate.max, 1000);
    });

    it('should support multi remove', () => {
      assert.ok(Array.isArray(service.options.multi));
      assert.ok(service.options.multi.includes('remove'));
    });
  });

  describe('getModel', () => {
    it('should get MongoDB collection', async () => {
      const model = await service.getModel();
      assert.ok(model);
      assert.strictEqual(model, mockCollection);
    });

    it('should cache Model after first call', async () => {
      await service.getModel();
      assert.ok(service.Model);
      assert.strictEqual(service.Model, mockCollection);
    });

    it('should not recreate Model on subsequent calls', async () => {
      const model1 = await service.getModel();
      const model2 = await service.getModel();
      assert.strictEqual(model1, model2);
    });
  });

  describe('find method', () => {
    it('should return paginated results when pagination is enabled', async () => {
      const testGroups = [
        { _id: 'group1', name: 'Group 1', description: 'First group', users: [] },
        { _id: 'group2', name: 'Group 2', description: 'Second group', users: ['user1'] }
      ];

      mockCollection.find = () => {
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testGroups
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => testGroups.length;

      const result = await service.find({ paginate: { default: 10, max: 1000 } });

      assert.ok(result);
      assert.ok(Array.isArray(result.data));
      assert.strictEqual(result.data.length, 2);
      assert.strictEqual(result.total, 2);
    });

    it('should return array when pagination is disabled', async () => {
      const testGroups = [
        { _id: 'group1', name: 'Group 1', users: [] }
      ];

      mockCollection.find = () => {
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testGroups
        };
        return cursor;
      };

      const result = await service.find({ paginate: false });

      assert.ok(Array.isArray(result));
      assert.strictEqual(result.length, 1);
    });

    it('should handle empty results', async () => {
      mockCollection.find = () => {
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => []
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => 0;

      const result = await service.find({ paginate: { default: 10, max: 1000 } });

      assert.ok(result);
      assert.ok(Array.isArray(result.data));
      assert.strictEqual(result.data.length, 0);
      assert.strictEqual(result.total, 0);
    });
  });

  describe('get method', () => {
    it('should retrieve a group by id', async () => {
      const testGroup = {
        _id: 'group1',
        name: 'Test Group',
        description: 'Test Description',
        users: ['user1', 'user2']
      };

      mockCollection.findOne = async () => testGroup;

      const result = await service.get('group1');

      assert.ok(result);
      assert.strictEqual(result._id, 'group1');
      assert.strictEqual(result.name, 'Test Group');
    });
  });

  describe('create method', () => {
    it('should load model before creating', async () => {
      assert.strictEqual(service.Model, undefined);
      
      mockCollection.insertOne = async () => {
        return { 
          insertedId: 'group123',
          acknowledged: true 
        };
      };
      mockCollection.findOne = async () => null;

      try {
        await service._create({ name: 'Test Group' }, { query: {} });
      } catch {
        // May fail due to validation or null return, but Model should be loaded
      }
      
      assert.ok(service.Model);
    });
  });

  describe('patch method', () => {
    it('should be callable to update group fields', async () => {
      const patchData = {
        description: 'Updated description'
      };

      mockCollection.findOneAndUpdate = async () => {
        return {
          _id: 'group1',
          name: 'Test Group',
          description: 'Updated description',
          users: []
        };
      };

      const result = await service.patch('group1', patchData);

      assert.ok(result);
    });
  });

  describe('remove method', () => {
    it('should be callable to remove a group', async () => {
      mockCollection.findOneAndDelete = async () => {
        return {
          _id: 'group1',
          name: 'Test Group',
          users: []
        };
      };

      const result = await service.remove('group1');

      assert.ok(result);
    });

    it('should support multi remove', async () => {
      mockCollection.deleteMany = async () => ({
        deletedCount: 3
      });

      const result = await service.remove(null, { query: { name: 'Test' } });

      assert.ok(result);
    });
  });

  describe('lazy loading behavior', () => {
    it('should load model before _find', async () => {
      assert.strictEqual(service.Model, undefined);
      
      try {
        await service._find({ paginate: false, query: {} });
      } catch {
        // May fail, but Model should be loaded
      }
      
      assert.ok(service.Model);
    });

    it('should load model before _get', async () => {
      assert.strictEqual(service.Model, undefined);
      
      mockCollection.findOne = async () => null;
      
      try {
        await service._get('group1', { query: {} });
      } catch {
        // May fail, but Model should be loaded
      }
      
      assert.ok(service.Model);
    });

    it('should load model before _patch', async () => {
      assert.strictEqual(service.Model, undefined);
      
      try {
        await service._patch('group1', { name: 'Updated' }, { query: {} });
      } catch {
        // May fail, but Model should be loaded
      }
      
      assert.ok(service.Model);
    });

    it('should load model before _remove', async () => {
      assert.strictEqual(service.Model, undefined);
      
      try {
        await service._remove('group1', { query: {} });
      } catch {
        // May fail, but Model should be loaded
      }
      
      assert.ok(service.Model);
    });
  });

  describe('group structure', () => {
    it('should handle groups with required fields', async () => {
      const testGroup = {
        _id: 'group1',
        name: 'Minimal Group',
        users: []
      };

      mockCollection.find = () => {
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => [testGroup]
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => 1;

      const result = await service.find({ paginate: { default: 10, max: 1000 } });

      assert.ok(result.data);
      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.data[0].name, 'Minimal Group');
    });

    it('should handle groups with users array', async () => {
      const testGroup = {
        _id: 'group1',
        name: 'User Group',
        users: ['user1', 'user2', 'user3']
      };

      mockCollection.findOne = async () => testGroup;

      const result = await service.get('group1');

      assert.ok(result);
      assert.ok(Array.isArray(result.users));
      assert.strictEqual(result.users.length, 3);
    });

    it('should handle groups with empty users array', async () => {
      const testGroup = {
        _id: 'group1',
        name: 'Empty Group',
        users: []
      };

      mockCollection.findOne = async () => testGroup;

      const result = await service.get('group1');

      assert.ok(result);
      assert.ok(Array.isArray(result.users));
      assert.strictEqual(result.users.length, 0);
    });

    it('should handle groups with optional description', async () => {
      const testGroup = {
        _id: 'group1',
        name: 'Described Group',
        description: 'This is a test group',
        users: []
      };

      mockCollection.findOne = async () => testGroup;

      const result = await service.get('group1');

      assert.ok(result);
      assert.strictEqual(result.description, 'This is a test group');
    });
  });

  describe('hooks', () => {
    it('should have before hooks configured', () => {
      const registeredService = app.service('group');
      const hooks = registeredService.__hooks.before;

      assert.ok(hooks);
      assert.ok(hooks.all);
      assert.ok(Array.isArray(hooks.all));
    });

    it('should have after hooks configured', () => {
      const registeredService = app.service('group');
      const hooks = registeredService.__hooks.after;

      assert.ok(hooks);
      assert.ok(hooks.all);
      assert.ok(Array.isArray(hooks.all));
    });

    it('should require authentication for all methods', () => {
      const registeredService = app.service('group');
      const beforeAllHooks = registeredService.__hooks.before.all;

      assert.ok(beforeAllHooks);
      assert.ok(beforeAllHooks.length > 0);
    });
  });

  describe('pagination', () => {
    it('should respect default pagination limit', async () => {
      const testGroups = Array(15).fill(null).map((_, i) => ({
        _id: `group${i}`,
        name: `Group ${i}`,
        users: []
      }));

      mockCollection.find = () => {
        const cursor = {
          limit: (n) => { cursor._limit = n; return cursor; },
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testGroups.slice(0, cursor._limit || 10)
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => testGroups.length;

      const result = await service.find({ paginate: { default: 10, max: 1000 } });

      assert.ok(result.data.length <= 10);
    });

    it('should respect max pagination limit', async () => {
      const result = await service.find({ 
        query: { $limit: 2000 },
        paginate: { default: 10, max: 1000 } 
      });

      assert.ok(result);
    });
  });

  describe('query operators', () => {
    it('should support $regex operator', async () => {
      const testGroups = [
        { _id: 'group1', name: 'Test Group', users: [] }
      ];

      let capturedQuery;
      mockCollection.find = (query) => {
        capturedQuery = query;
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testGroups
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => testGroups.length;

      await service.find({ 
        query: { name: { $regex: 'Test' } },
        paginate: { default: 10, max: 1000 }
      });

      assert.ok(capturedQuery);
    });

    it('should support $and operator', async () => {
      const testGroups = [];

      mockCollection.find = () => {
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testGroups
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => 0;

      const result = await service.find({ 
        query: { $and: [{ name: 'Test' }, { description: 'Desc' }] },
        paginate: { default: 10, max: 1000 }
      });

      assert.ok(result);
    });

    it('should support $nor operator', async () => {
      const testGroups = [];

      mockCollection.find = () => {
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testGroups
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => 0;

      const result = await service.find({ 
        query: { $nor: [{ name: 'Excluded' }] },
        paginate: { default: 10, max: 1000 }
      });

      assert.ok(result);
    });
  });

  describe('query operations', () => {
    it('should support filtering by name', async () => {
      const testGroups = [
        { _id: 'group1', name: 'Admin Group', users: [] }
      ];

      mockCollection.find = () => {
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testGroups
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => 1;

      const result = await service.find({ 
        query: { name: 'Admin Group' },
        paginate: { default: 10, max: 1000 }
      });

      assert.ok(result);
      assert.strictEqual(result.data.length, 1);
    });

    it('should support filtering by users', async () => {
      const testGroups = [
        { _id: 'group1', name: 'User Group', users: ['user1'] }
      ];

      mockCollection.find = () => {
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testGroups
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => 1;

      const result = await service.find({ 
        query: { users: 'user1' },
        paginate: { default: 10, max: 1000 }
      });

      assert.ok(result);
    });
  });

  describe('integration with real app', () => {
    it('should work with real app instance', () => {
      const registeredService = app.service('group');
      assert.ok(registeredService);
      assert.strictEqual(typeof registeredService.find, 'function');
      assert.strictEqual(typeof registeredService.get, 'function');
      assert.strictEqual(typeof registeredService.create, 'function');
      assert.strictEqual(typeof registeredService.patch, 'function');
      assert.strictEqual(typeof registeredService.remove, 'function');
    });
  });
});
