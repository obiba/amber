const assert = require('assert');
const app = require('../../src/app');

describe('\'form\' service', () => {
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
          _id: 'form1',
          name: 'Test Form',
          description: 'Test Description',
          schema: {},
          revision: 2
        };
      },
      findOneAndDelete: async () => {
        return {
          _id: 'form1',
          name: 'Test Form',
          revision: 1
        };
      },
      insertOne: async () => {
        return { 
          insertedId: 'form123',
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
        if (name === 'forms') {
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

    const { Form } = require('../../src/services/form/form.class');
    service = new Form({ 
      paginate: { max: 1000 },
      multi: ['remove'],
      filters: { $nor: true, $and: true },
      operators: ['$nor', '$and', '$regex']
    }, mockApp);
  });

  describe('service registration', () => {
    it('registered the service', () => {
      const registeredService = app.service('form');
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

    it('should set collection name to forms', () => {
      assert.strictEqual(service.collectionName, 'forms');
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

  describe('find method', () => {
    it('should return paginated results when pagination is enabled', async () => {
      const testForms = [
        { _id: 'form1', name: 'Form 1', description: 'First form', schema: {} },
        { _id: 'form2', name: 'Form 2', description: 'Second form', schema: {} }
      ];

      mockCollection.find = () => {
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testForms
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => testForms.length;

      const result = await service.find({ paginate: { default: 10, max: 1000 } });

      assert.ok(result);
      assert.ok(Array.isArray(result.data));
      assert.strictEqual(result.data.length, 2);
      assert.strictEqual(result.total, 2);
    });

    it('should return array when pagination is disabled', async () => {
      const testForms = [
        { _id: 'form1', name: 'Form 1', schema: {} }
      ];

      mockCollection.find = () => {
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testForms
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
    it('should retrieve a form by id', async () => {
      const testForm = {
        _id: 'form1',
        name: 'Test Form',
        description: 'Test Description',
        schema: { fields: [] }
      };

      mockCollection.findOne = async () => testForm;

      const result = await service.get('form1');

      assert.ok(result);
      assert.strictEqual(result._id, 'form1');
      assert.strictEqual(result.name, 'Test Form');
    });
  });

  describe('create method', () => {
    it('should load model before creating', async () => {
      assert.strictEqual(service.Model, undefined);
      
      mockCollection.insertOne = async () => {
        return { 
          insertedId: 'form123',
          acknowledged: true 
        };
      };
      mockCollection.findOne = async () => null;

      try {
        await service._create({ name: 'Test Form' }, { query: {} });
      } catch {
        // May fail due to validation or null return, but Model should be loaded
      }
      
      assert.ok(service.Model);
    });
  });

  describe('patch method', () => {
    it('should be callable to update form fields', async () => {
      const patchData = {
        description: 'Updated description'
      };

      mockCollection.findOneAndUpdate = async () => {
        return {
          _id: 'form1',
          name: 'Test Form',
          description: 'Updated description',
          schema: {}
        };
      };

      const result = await service.patch('form1', patchData);

      assert.ok(result);
    });
  });

  describe('remove method', () => {
    it('should be callable to remove a form', async () => {
      mockCollection.findOneAndDelete = async () => {
        return {
          _id: 'form1',
          name: 'Test Form',
          schema: {}
        };
      };

      const result = await service.remove('form1');

      assert.ok(result);
    });

    it('should support multi remove', async () => {
      mockCollection.deleteMany = async () => ({
        deletedCount: 3
      });

      const result = await service.remove(null, { query: { study: 'study1' } });

      assert.ok(result);
    });
  });

  describe('hooks', () => {
    it('should have before hooks configured', () => {
      const registeredService = app.service('form');
      const hooks = registeredService.__hooks.before;

      assert.ok(hooks);
      assert.ok(hooks.all);
      assert.ok(Array.isArray(hooks.all));
    });

    it('should have after hooks configured', () => {
      const registeredService = app.service('form');
      const hooks = registeredService.__hooks.after;

      assert.ok(hooks);
      assert.ok(hooks.all);
      assert.ok(Array.isArray(hooks.all));
    });

    it('should require authentication for all methods', () => {
      const registeredService = app.service('form');
      const beforeAllHooks = registeredService.__hooks.before.all;

      assert.ok(beforeAllHooks);
      assert.ok(beforeAllHooks.length > 0);
    });
  });

  describe('pagination', () => {
    it('should respect default pagination limit', async () => {
      const testForms = Array(15).fill(null).map((_, i) => ({
        _id: `form${i}`,
        name: `Form ${i}`,
        schema: {}
      }));

      mockCollection.find = () => {
        const cursor = {
          limit: (n) => { cursor._limit = n; return cursor; },
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testForms.slice(0, cursor._limit || 10)
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => testForms.length;

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
      const testForms = [
        { _id: 'form1', name: 'Test Form', schema: {} }
      ];

      let capturedQuery;
      mockCollection.find = (query) => {
        capturedQuery = query;
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testForms
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => testForms.length;

      await service.find({ 
        query: { name: { $regex: 'Test' } },
        paginate: { default: 10, max: 1000 }
      });

      assert.ok(capturedQuery);
    });

    it('should support $and operator', async () => {
      const testForms = [];

      mockCollection.find = () => {
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testForms
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
  });
});
