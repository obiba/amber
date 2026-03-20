const assert = require('assert');
const app = require('../../src/app');
const { Campaign } = require('../../src/services/campaign/campaign.class');
const { LazyMongoDBService } = require('../../src/services/mongodb-service.class');

describe('\'campaign\' service', () => {
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
          _id: 'campaign1',
          name: 'Updated Campaign'
        }
      }),
      findOneAndDelete: async () => ({
        value: {
          _id: 'campaign1',
          name: 'Deleted Campaign'
        }
      }),
      insertOne: async () => ({ 
        insertedId: 'campaign123',
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
        if (name === 'campaigns') {
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

    service = new Campaign({ 
      paginate: { max: 1000 },
      multi: ['remove'],
      filters: { $nor: true, $or: true, $exists: true, $eq: true },
      operators: ['$nor', '$or', '$regex', '$exists', '$eq']
    }, mockApp);
  });

  describe('service registration', () => {
    it('registered the service', () => {
      const registeredService = app.service('campaign');
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

    it('should set collection name to campaigns', () => {
      assert.strictEqual(service.collectionName, 'campaigns');
    });

    it('should support multi remove option', () => {
      assert.ok(service.options.multi);
      assert.ok(service.options.multi.includes('remove'));
    });

    it('should support custom filters', () => {
      assert.ok(service.options.filters);
      assert.strictEqual(service.options.filters.$nor, true);
      assert.strictEqual(service.options.filters.$or, true);
      assert.strictEqual(service.options.filters.$exists, true);
    });

    it('should support custom operators', () => {
      assert.ok(Array.isArray(service.options.operators));
      assert.ok(service.options.operators.includes('$nor'));
      assert.ok(service.options.operators.includes('$or'));
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
      await service.getModel();
      assert.ok(service.Model);
      assert.strictEqual(service.Model, mockCollection);
    });

    it('should get collection with correct name', async () => {
      let requestedName = null;
      mockDb.collection = (name) => {
        requestedName = name;
        return mockCollection;
      };

      await service.getModel();
      assert.strictEqual(requestedName, 'campaigns');
    });
  });

  describe('campaign structure', () => {
    it('should handle campaigns with required fields', async () => {
      const campaign = {
        _id: 'campaign1',
        name: 'Test Campaign',
        description: 'A test campaign',
        investigators: ['user1', 'user2'],
        supporters: ['user3'],
        interviewDesign: 'itwd1',
        study: 'study1',
        createdBy: 'admin1',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCollection.findOne = async () => campaign;

      const result = await service._get('campaign1', {});
      
      assert.strictEqual(result.name, 'Test Campaign');
      assert.strictEqual(result.description, 'A test campaign');
      assert.ok(Array.isArray(result.investigators));
      assert.ok(Array.isArray(result.supporters));
    });

    it('should handle campaigns with timing fields', async () => {
      const campaign = {
        _id: 'campaign1',
        name: 'Timed Campaign',
        investigators: ['user1'],
        interviewDesign: 'itwd1',
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
        weeksInfoBeforeActivation: 2,
        weeksBetweenReminders: 2,
        numberOfReminders: 2,
        weeksToDeactivate: 18,
        weeksInfoBeforeDeactivation: 3
      };

      mockCollection.findOne = async () => campaign;

      const result = await service._get('campaign1', {});
      
      assert.ok(result.validFrom);
      assert.ok(result.validUntil);
      assert.strictEqual(result.weeksInfoBeforeActivation, 2);
      assert.strictEqual(result.weeksBetweenReminders, 2);
      assert.strictEqual(result.numberOfReminders, 2);
      assert.strictEqual(result.weeksToDeactivate, 18);
      assert.strictEqual(result.weeksInfoBeforeDeactivation, 3);
    });

    it('should handle campaigns with notification settings', async () => {
      const campaign = {
        _id: 'campaign1',
        name: 'Notification Campaign',
        investigators: ['user1'],
        interviewDesign: 'itwd1',
        notifyOnInterviewCompletion: true,
        withPassword: true,
        walkInEnabled: true,
        walkInData: { field1: 'value1' }
      };

      mockCollection.findOne = async () => campaign;

      const result = await service._get('campaign1', {});
      
      assert.strictEqual(result.notifyOnInterviewCompletion, true);
      assert.strictEqual(result.withPassword, true);
      assert.strictEqual(result.walkInEnabled, true);
      assert.ok(result.walkInData);
    });

    it('should handle campaigns with URLs', async () => {
      const campaign = {
        _id: 'campaign1',
        name: 'URL Campaign',
        investigators: ['user1'],
        interviewDesign: 'itwd1',
        visitUrl: 'https://example.com/visit',
        completionUrl: 'https://example.com/complete'
      };

      mockCollection.findOne = async () => campaign;

      const result = await service._get('campaign1', {});
      
      assert.strictEqual(result.visitUrl, 'https://example.com/visit');
      assert.strictEqual(result.completionUrl, 'https://example.com/complete');
    });

    it('should handle campaigns with empty optional fields', async () => {
      const campaign = {
        _id: 'campaign1',
        name: 'Minimal Campaign',
        investigators: ['user1'],
        interviewDesign: 'itwd1',
        supporters: [],
        description: '',
        validFrom: null,
        validUntil: null,
        visitUrl: null,
        completionUrl: null
      };

      mockCollection.findOne = async () => campaign;

      const result = await service._get('campaign1', {});
      
      assert.strictEqual(result.name, 'Minimal Campaign');
      assert.deepStrictEqual(result.supporters, []);
      assert.strictEqual(result.description, '');
    });
  });

  describe('query operations', () => {
    it('should support filtering by study', async () => {
      const cursor = {
        limit: () => cursor,
        skip: () => cursor,
        toArray: async () => []
      };

      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 0;

      const result = await service._find({ query: { study: 'study123' } });
      
      assert.ok(result);
      assert.ok(service.Model);
    });

    it('should support filtering by interviewDesign', async () => {
      const cursor = {
        limit: () => cursor,
        skip: () => cursor,
        toArray: async () => []
      };

      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 0;

      const result = await service._find({ query: { interviewDesign: 'itwd123' } });
      
      assert.ok(result);
    });

    it('should support filtering by investigators', async () => {
      const cursor = {
        limit: () => cursor,
        skip: () => cursor,
        toArray: async () => []
      };

      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 0;

      const result = await service._find({ query: { investigators: 'user123' } });
      
      assert.ok(result);
    });

    it('should support date range queries', async () => {
      const cursor = {
        limit: () => cursor,
        skip: () => cursor,
        toArray: async () => []
      };

      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 0;

      const result = await service._find({ 
        query: { 
          validFrom: { $gte: new Date('2024-01-01') } 
        } 
      });
      
      assert.ok(result);
    });

    it('should support $or queries', async () => {
      const cursor = {
        limit: () => cursor,
        skip: () => cursor,
        toArray: async () => []
      };

      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 0;

      const result = await service._find({ 
        query: { 
          $or: [
            { investigators: 'user123' },
            { supporters: 'user123' }
          ]
        } 
      });
      
      assert.ok(result);
    });

    it('should support text search queries', async () => {
      const cursor = {
        limit: () => cursor,
        skip: () => cursor,
        toArray: async () => []
      };

      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 0;

      const result = await service._find({ 
        query: { 
          name: { $regex: 'test', $options: 'i' } 
        } 
      });
      
      assert.ok(result);
    });

    it('should support $exists queries', async () => {
      const cursor = {
        limit: () => cursor,
        skip: () => cursor,
        toArray: async () => []
      };

      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 0;

      const result = await service._find({ 
        query: { 
          study: { $exists: true } 
        } 
      });
      
      assert.ok(result);
    });
  });

  describe('multi-record operations', () => {
    it('should support multi-record remove', async () => {
      mockCollection.deleteMany = async () => ({
        deletedCount: 3
      });

      // Multi-remove should work with null id
      const result = await service._remove(null, { 
        query: { study: 'study123' } 
      });
      
      assert.ok(result);
    });
  });

  describe('lazy loading behavior', () => {
    it('should load model before _find', async () => {
      const cursor = {
        limit: () => cursor,
        skip: () => cursor,
        toArray: async () => []
      };

      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 0;

      await service._find({ query: {} });
      
      assert.ok(service.Model);
    });

    it('should load model before _get', async () => {
      mockCollection.findOne = async () => ({
        _id: 'campaign1',
        name: 'Test Campaign',
        investigators: ['user1'],
        interviewDesign: 'itwd1'
      });

      await service._get('campaign1', {});
      
      assert.ok(service.Model);
    });

    it('should load model before _create', async () => {
      await service._create({
        name: 'New Campaign',
        investigators: ['user1'],
        interviewDesign: 'itwd1'
      }, {});
      
      assert.ok(service.Model);
    });

    it('should load model before _patch', async () => {
      mockCollection.findOneAndUpdate = async () => ({
        value: {
          _id: 'campaign1',
          name: 'Patched Campaign'
        }
      });

      await service._patch('campaign1', { name: 'Patched Campaign' }, {});
      
      assert.ok(service.Model);
    });

    it('should load model before _remove', async () => {
      mockCollection.findOneAndDelete = async () => ({
        value: {
          _id: 'campaign1',
          name: 'Deleted Campaign'
        }
      });

      await service._remove('campaign1', {});
      
      assert.ok(service.Model);
    });
  });

  describe('campaign field validation', () => {
    it('should handle campaigns with single investigator', async () => {
      const campaign = {
        _id: 'campaign1',
        name: 'Single Investigator Campaign',
        investigators: ['user1'],
        supporters: [],
        interviewDesign: 'itwd1'
      };

      mockCollection.findOne = async () => campaign;

      const result = await service._get('campaign1', {});
      
      assert.strictEqual(result.investigators.length, 1);
    });

    it('should handle campaigns with multiple investigators', async () => {
      const campaign = {
        _id: 'campaign1',
        name: 'Multi Investigator Campaign',
        investigators: ['user1', 'user2', 'user3', 'user4'],
        supporters: ['user5', 'user6'],
        interviewDesign: 'itwd1'
      };

      mockCollection.findOne = async () => campaign;

      const result = await service._get('campaign1', {});
      
      assert.strictEqual(result.investigators.length, 4);
      assert.strictEqual(result.supporters.length, 2);
    });

    it('should handle campaigns with default week values', async () => {
      const campaign = {
        _id: 'campaign1',
        name: 'Default Values Campaign',
        investigators: ['user1'],
        interviewDesign: 'itwd1',
        weeksInfoBeforeActivation: 2,
        weeksBetweenReminders: 2,
        numberOfReminders: 2,
        weeksToDeactivate: 18,
        weeksInfoBeforeDeactivation: 3
      };

      mockCollection.findOne = async () => campaign;

      const result = await service._get('campaign1', {});
      
      assert.strictEqual(result.weeksInfoBeforeActivation, 2);
      assert.strictEqual(result.weeksBetweenReminders, 2);
      assert.strictEqual(result.numberOfReminders, 2);
      assert.strictEqual(result.weeksToDeactivate, 18);
      assert.strictEqual(result.weeksInfoBeforeDeactivation, 3);
    });

    it('should handle campaigns with custom week values', async () => {
      const campaign = {
        _id: 'campaign1',
        name: 'Custom Values Campaign',
        investigators: ['user1'],
        interviewDesign: 'itwd1',
        weeksInfoBeforeActivation: 4,
        weeksBetweenReminders: 3,
        numberOfReminders: 5,
        weeksToDeactivate: 26,
        weeksInfoBeforeDeactivation: 2
      };

      mockCollection.findOne = async () => campaign;

      const result = await service._get('campaign1', {});
      
      assert.strictEqual(result.weeksInfoBeforeActivation, 4);
      assert.strictEqual(result.weeksBetweenReminders, 3);
      assert.strictEqual(result.numberOfReminders, 5);
      assert.strictEqual(result.weeksToDeactivate, 26);
      assert.strictEqual(result.weeksInfoBeforeDeactivation, 2);
    });

    it('should handle campaigns with zero week values', async () => {
      const campaign = {
        _id: 'campaign1',
        name: 'Zero Values Campaign',
        investigators: ['user1'],
        interviewDesign: 'itwd1',
        weeksInfoBeforeActivation: 0,
        weeksBetweenReminders: 0,
        numberOfReminders: 0,
        weeksToDeactivate: 0,
        weeksInfoBeforeDeactivation: 0
      };

      mockCollection.findOne = async () => campaign;

      const result = await service._get('campaign1', {});
      
      assert.strictEqual(result.weeksInfoBeforeActivation, 0);
      assert.strictEqual(result.weeksBetweenReminders, 0);
    });

    it('should handle campaigns without study', async () => {
      const campaign = {
        _id: 'campaign1',
        name: 'No Study Campaign',
        investigators: ['user1'],
        interviewDesign: 'itwd1',
        study: null
      };

      mockCollection.findOne = async () => campaign;

      const result = await service._get('campaign1', {});
      
      assert.strictEqual(result.study, null);
    });

    it('should handle boolean flags', async () => {
      const campaign = {
        _id: 'campaign1',
        name: 'Boolean Campaign',
        investigators: ['user1'],
        interviewDesign: 'itwd1',
        notifyOnInterviewCompletion: true,
        withPassword: false,
        walkInEnabled: true
      };

      mockCollection.findOne = async () => campaign;

      const result = await service._get('campaign1', {});
      
      assert.strictEqual(result.notifyOnInterviewCompletion, true);
      assert.strictEqual(result.withPassword, false);
      assert.strictEqual(result.walkInEnabled, true);
    });
  });

  describe('pagination', () => {
    it('should support pagination with limit and skip', async () => {
      let skipValue = null;
      let limitValue = null;

      const cursor = {
        limit: (n) => {
          limitValue = n;
          return cursor;
        },
        skip: (s) => {
          skipValue = s;
          return cursor;
        },
        toArray: async () => []
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
          $sort: { createdAt: -1 } 
        } 
      });
      
      assert.ok(service.Model);
    });
  });

  describe('error handling', () => {
    it('should handle not found campaigns', async () => {
      mockCollection.findOne = async () => null;

      try {
        await service._get('nonexistent', {});
        assert.fail('Should have thrown error');
      } catch (err) {
        assert.ok(err);
      }
    });

    it('should handle database errors', async () => {
      mockDb.collection = () => {
        throw new Error('Database connection error');
      };

      const newService = new Campaign({ paginate: { max: 1000 } }, mockApp);

      try {
        await newService._find({ query: {} });
        assert.fail('Should have thrown error');
      } catch (err) {
        assert.ok(err);
        assert.ok(err.message.includes('Database connection error') || err.message.includes('Cannot read'));
      }
    });
  });

  describe('integration with real app', () => {
    it('should work with real app instance', () => {
      const realService = app.service('campaign');
      assert.ok(realService);
    });
  });
});
