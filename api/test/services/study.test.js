const assert = require('assert');
const appPromise = require('../../src/app');
let app;
const { Study } = require('../../src/services/study/study.class');
const { LazyMongoDBService } = require('../../src/services/mongodb-service.class');

before(async function() { this.timeout(30000); app = await appPromise; });

describe('\'study\' service', () => {
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
        toArray: async () => data
      };
      return cursor;
    };

    mockCollection = {
      find: () => createCursor([]),
      findOne: async () => null,
      findOneAndUpdate: async () => ({
        value: {
          _id: 'study1',
          name: 'Updated Study'
        }
      }),
      findOneAndDelete: async () => ({
        value: {
          _id: 'study1',
          name: 'Deleted Study'
        }
      }),
      insertOne: async () => ({ 
        insertedId: 'study123',
        acknowledged: true 
      }),
      deleteMany: async () => ({
        deletedCount: 5
      }),
      countDocuments: async () => 0
    };

    // Create mock database
    mockDb = {
      collection: (name) => {
        if (name === 'studies') {
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

    service = new Study({ 
      paginate: { max: 1000 },
      multi: ['remove'],
      filters: { $nor: true, $and: true },
      operators: ['$nor', '$and', '$regex']
    }, mockApp);
  });

  describe('service registration', () => {
    it('registered the service', () => {
      const registeredService = app.service('study');
      assert.ok(registeredService, 'Registered the service');
    });
  });

  describe('constructor', () => {
    it('should extend LazyMongoDBService', () => {
      assert.ok(service instanceof LazyMongoDBService);
    });

    it('should initialize with options and app', () => {
      assert.ok(service.app);
      assert.ok(service.options);
      assert.strictEqual(service.app, mockApp);
    });

    it('should set collection name to studies', () => {
      assert.strictEqual(service.collectionName, 'studies');
    });

    it('should have pagination options', () => {
      assert.ok(service.options.paginate);
      assert.strictEqual(service.options.paginate.max, 1000);
    });

    it('should support multi remove', () => {
      assert.ok(service.options.multi);
      assert.ok(service.options.multi.includes('remove'));
    });

    it('should support custom filters', () => {
      assert.ok(service.options.filters);
      assert.strictEqual(service.options.filters.$nor, true);
      assert.strictEqual(service.options.filters.$and, true);
    });

    it('should support custom operators', () => {
      assert.ok(service.options.operators);
      assert.ok(service.options.operators.includes('$nor'));
      assert.ok(service.options.operators.includes('$and'));
      assert.ok(service.options.operators.includes('$regex'));
    });
  });

  describe('getModel', () => {
    it('should get MongoDB collection', async () => {
      const model = await service.getModel();
      assert.ok(model);
      assert.strictEqual(model, mockCollection);
    });

    it('should cache Model after first call', async () => {
      const model1 = await service.getModel();
      const model2 = await service.getModel();
      assert.strictEqual(model1, model2);
    });

    it('should not recreate Model on subsequent calls', async () => {
      await service.getModel();
      assert.ok(service.Model);
      const cachedModel = service.Model;
      await service.getModel();
      assert.strictEqual(service.Model, cachedModel);
    });

    it('should get collection with correct name', async () => {
      const model = await service.getModel();
      assert.ok(model);
      assert.strictEqual(service.collectionName, 'studies');
    });
  });

  describe('lazy loading behavior', () => {
    it('should load model before _find', async () => {
      await service._find({});
      assert.ok(service.Model);
      assert.strictEqual(service.Model, mockCollection);
    });

    it('should load model before _get', async () => {
      mockCollection.findOne = async () => ({ 
        _id: 'study1', 
        name: 'Test Study',
        description: 'Test description',
        services: [],
        forms: []
      });
      await service._get('study1', {});
      assert.ok(service.Model);
    });

    it('should load model before _create', async () => {
      const newStudy = {
        name: 'New Study',
        description: 'New study description',
        services: [],
        forms: []
      };

      mockCollection.insertOne = async () => ({ 
        insertedId: 'new-study-id',
        acknowledged: true 
      });

      await service._create(newStudy, {});
      assert.ok(service.Model);
    });

    it('should load model before _patch', async () => {
      mockCollection.findOneAndUpdate = async () => ({
        value: { 
          _id: 'study1', 
          name: 'Patched Study',
          description: 'Updated',
          services: [],
          forms: []
        }
      });

      await service._patch('study1', { name: 'Patched Study' }, {});
      assert.ok(service.Model);
    });

    it('should load model before _remove', async () => {
      mockCollection.findOneAndDelete = async () => ({
        value: { 
          _id: 'study1', 
          name: 'Test Study',
          description: 'Test',
          services: [],
          forms: []
        }
      });

      await service._remove('study1', {});
      assert.ok(service.Model);
    });
  });

  describe('study structure', () => {
    it('should handle studies with required fields', async () => {
      const study = {
        _id: 'study1',
        name: 'Clinical Trial Study',
        description: '',
        services: [],
        forms: []
      };

      mockCollection.findOne = async () => study;

      const result = await service._get('study1', {});
      
      assert.strictEqual(result.name, 'Clinical Trial Study');
      assert.strictEqual(result.description, '');
      assert.ok(Array.isArray(result.services));
      assert.ok(Array.isArray(result.forms));
    });

    it('should handle studies with description', async () => {
      const study = {
        _id: 'study2',
        name: 'Diabetes Study',
        description: 'A comprehensive study on diabetes management',
        services: [],
        forms: []
      };

      mockCollection.findOne = async () => study;

      const result = await service._get('study2', {});
      
      assert.strictEqual(result.description, 'A comprehensive study on diabetes management');
    });

    it('should handle studies with services array', async () => {
      const study = {
        _id: 'study3',
        name: 'Multi-Service Study',
        description: 'Study with multiple services',
        services: ['service1', 'service2', 'service3'],
        forms: []
      };

      mockCollection.findOne = async () => study;

      const result = await service._get('study3', {});
      
      assert.ok(Array.isArray(result.services));
      assert.strictEqual(result.services.length, 3);
      assert.ok(result.services.includes('service1'));
      assert.ok(result.services.includes('service2'));
      assert.ok(result.services.includes('service3'));
    });

    it('should handle studies with forms array', async () => {
      const study = {
        _id: 'study4',
        name: 'Forms Study',
        description: 'Study with multiple forms',
        services: [],
        forms: ['form1', 'form2']
      };

      mockCollection.findOne = async () => study;

      const result = await service._get('study4', {});
      
      assert.ok(Array.isArray(result.forms));
      assert.strictEqual(result.forms.length, 2);
      assert.ok(result.forms.includes('form1'));
      assert.ok(result.forms.includes('form2'));
    });

    it('should handle studies with empty optional fields', async () => {
      const study = {
        _id: 'study5',
        name: 'Minimal Study',
        description: '',
        services: [],
        forms: []
      };

      mockCollection.findOne = async () => study;

      const result = await service._get('study5', {});
      
      assert.strictEqual(result.description, '');
      assert.strictEqual(result.services.length, 0);
      assert.strictEqual(result.forms.length, 0);
    });

    it('should handle studies with null description', async () => {
      const study = {
        _id: 'study6',
        name: 'Null Description Study',
        description: null,
        services: [],
        forms: []
      };

      mockCollection.findOne = async () => study;

      const result = await service._get('study6', {});
      
      assert.strictEqual(result.description, null);
    });

    it('should handle studies with createdBy field', async () => {
      const study = {
        _id: 'study7',
        name: 'User Study',
        description: 'Study created by user',
        services: [],
        forms: [],
        createdBy: 'user123'
      };

      mockCollection.findOne = async () => study;

      const result = await service._get('study7', {});
      
      assert.strictEqual(result.createdBy, 'user123');
    });
  });

  describe('query operations', () => {
    it('should support filtering by name', async () => {
      const studies = [
        {
          _id: 's1',
          name: 'Diabetes Study',
          description: '',
          services: [],
          forms: []
        }
      ];

      mockCollection.find = (query) => {
        assert.ok(query.name);
        return createCursor(studies)();
      };

      const createCursor = (data) => () => ({
        limit: () => ({ skip: () => ({ toArray: async () => data }) })
      });

      await service._find({ query: { name: 'Diabetes Study' } });
    });

    it('should support filtering by description', async () => {
      const studies = [
        {
          _id: 's2',
          name: 'Cancer Study',
          description: 'Cancer research',
          services: [],
          forms: []
        }
      ];

      mockCollection.find = (query) => {
        assert.ok(query.description);
        return createCursor(studies)();
      };

      const createCursor = (data) => () => ({
        limit: () => ({ skip: () => ({ toArray: async () => data }) })
      });

      await service._find({ query: { description: 'Cancer research' } });
    });

    it('should support $regex queries for name search', async () => {
      const cursor = {
        limit: () => cursor,
        skip: () => cursor,
        toArray: async () => []
      };

      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 0;

      const result = await service._find({ 
        query: { 
          name: { $regex: 'diabetes', $options: 'i' } 
        } 
      });
      
      assert.ok(result);
    });

    it('should support $and queries', async () => {
      const cursor = {
        limit: () => cursor,
        skip: () => cursor,
        toArray: async () => []
      };

      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 0;

      const result = await service._find({ 
        query: { 
          $and: [
            { name: 'Study A' },
            { description: { $ne: '' } }
          ]
        } 
      });
      
      assert.ok(result);
    });

    it('should support $nor queries', async () => {
      const cursor = {
        limit: () => cursor,
        skip: () => cursor,
        toArray: async () => []
      };

      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 0;

      const result = await service._find({ 
        query: { 
          $nor: [
            { name: 'Excluded Study' },
            { description: null }
          ]
        } 
      });
      
      assert.ok(result);
    });

    it('should support filtering by forms', async () => {
      const studies = [
        {
          _id: 's3',
          name: 'Form Study',
          description: '',
          services: [],
          forms: ['form1']
        }
      ];

      mockCollection.find = () => {
        return createCursor(studies)();
      };

      const createCursor = (data) => () => ({
        limit: () => ({ skip: () => ({ toArray: async () => data }) })
      });

      await service._find({ query: { forms: 'form1' } });
    });

    it('should support filtering by services', async () => {
      const studies = [
        {
          _id: 's4',
          name: 'Service Study',
          description: '',
          services: ['service1'],
          forms: []
        }
      ];

      mockCollection.find = () => {
        return createCursor(studies)();
      };

      const createCursor = (data) => () => ({
        limit: () => ({ skip: () => ({ toArray: async () => data }) })
      });

      await service._find({ query: { services: 'service1' } });
    });
  });

  describe('multi-record operations', () => {
    it('should support multi-record remove option', () => {
      assert.ok(service.options.multi);
      assert.ok(service.options.multi.includes('remove'));
    });

    it('should allow removing multiple studies by query', async () => {
      mockCollection.deleteMany = async (query) => {
        assert.ok(query);
        return { deletedCount: 3 };
      };

      const result = await service._remove(null, { 
        query: { description: '' } 
      });
      
      assert.ok(result);
    });
  });

  describe('pagination', () => {
    it('should support pagination with limit and skip', async () => {
      const studies = Array.from({ length: 5 }, (_, i) => ({
        _id: `s${i + 1}`,
        name: `Study ${i + 1}`,
        description: `Description ${i + 1}`,
        services: [],
        forms: []
      }));

      let limitValue = null;
      let skipValue = null;

      const cursor = {
        limit: (n) => {
          limitValue = n;
          return cursor;
        },
        skip: (s) => {
          skipValue = s;
          return cursor;
        },
        toArray: async () => studies
      };

      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 100;

      await service._find({ 
        query: { $skip: 20, $limit: 10 } 
      });

      assert.strictEqual(limitValue, 10);
      assert.strictEqual(skipValue, 20);
    });

    it('should handle sorting', async () => {
      const cursor = {
        limit: () => cursor,
        skip: () => cursor,
        sort: () => cursor,
        toArray: async () => []
      };

      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 0;

      await service._find({ 
        query: { 
          $sort: { name: 1 } 
        } 
      });
    });
  });

  describe('field validation', () => {
    it('should handle studies with single form', async () => {
      const study = {
        _id: 'study8',
        name: 'Single Form Study',
        description: '',
        services: [],
        forms: ['form1']
      };

      mockCollection.findOne = async () => study;

      const result = await service._get('study8', {});
      
      assert.strictEqual(result.forms.length, 1);
      assert.strictEqual(result.forms[0], 'form1');
    });

    it('should handle studies with multiple forms', async () => {
      const study = {
        _id: 'study9',
        name: 'Multiple Forms Study',
        description: '',
        services: [],
        forms: ['form1', 'form2', 'form3']
      };

      mockCollection.findOne = async () => study;

      const result = await service._get('study9', {});
      
      assert.strictEqual(result.forms.length, 3);
    });

    it('should handle studies with single service', async () => {
      const study = {
        _id: 'study10',
        name: 'Single Service Study',
        description: '',
        services: ['service1'],
        forms: []
      };

      mockCollection.findOne = async () => study;

      const result = await service._get('study10', {});
      
      assert.strictEqual(result.services.length, 1);
      assert.strictEqual(result.services[0], 'service1');
    });

    it('should handle studies with multiple services', async () => {
      const study = {
        _id: 'study11',
        name: 'Multiple Services Study',
        description: '',
        services: ['service1', 'service2', 'service3', 'service4'],
        forms: []
      };

      mockCollection.findOne = async () => study;

      const result = await service._get('study11', {});
      
      assert.strictEqual(result.services.length, 4);
    });

    it('should handle studies with long descriptions', async () => {
      const longDescription = 'This is a very long description that contains multiple sentences. '.repeat(10);
      const study = {
        _id: 'study12',
        name: 'Long Description Study',
        description: longDescription,
        services: [],
        forms: []
      };

      mockCollection.findOne = async () => study;

      const result = await service._get('study12', {});
      
      assert.ok(result.description.length > 100);
      assert.strictEqual(result.description, longDescription);
    });

    it('should handle studies with special characters in name', async () => {
      const study = {
        _id: 'study13',
        name: 'Study (2024) - Phase III',
        description: 'Special characters: @#$%',
        services: [],
        forms: []
      };

      mockCollection.findOne = async () => study;

      const result = await service._get('study13', {});
      
      assert.strictEqual(result.name, 'Study (2024) - Phase III');
      assert.strictEqual(result.description, 'Special characters: @#$%');
    });
  });

  describe('error handling', () => {
    it('should handle not found studies', async () => {
      mockCollection.findOne = async () => null;

      try {
        await service._get('nonexistent', {});
        assert.fail('Should have thrown error');
      } catch (err) {
        assert.ok(err);
      }
    });

    it('should handle database errors', async () => {
      mockCollection.find = () => {
        throw new Error('Database connection error');
      };

      try {
        await service._find({});
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error);
      }
    });
  });

  describe('integration with real app', () => {
    it('should work with real app instance', () => {
      const realService = app.service('study');
      assert.ok(realService);
      assert.ok(realService instanceof LazyMongoDBService);
    });

    it('should have correct collection name in real instance', () => {
      const realService = app.service('study');
      assert.strictEqual(realService.collectionName, 'studies');
    });

    it('should support multi remove in real instance', () => {
      const realService = app.service('study');
      assert.ok(realService.options.multi);
      assert.ok(realService.options.multi.includes('remove'));
    });
  });
});
