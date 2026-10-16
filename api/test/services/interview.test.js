const assert = require('assert');
const appPromise = require('../../src/app');
let app;
const { Interview } = require('../../src/services/interview/interview.class');
const { LazyMongoDBService } = require('../../src/services/mongodb-service.class');

before(async function() { this.timeout(30000); app = await appPromise; });

describe('\'interview\' service', () => {
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
          _id: 'interview1',
          code: 'INT-001'
        }
      }),
      findOneAndDelete: async () => ({
        value: {
          _id: 'interview1',
          code: 'INT-001'
        }
      }),
      insertOne: async () => ({ 
        insertedId: 'interview123',
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
        if (name === 'interviews') {
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

    service = new Interview({ 
      paginate: { max: 1000 },
      multi: ['remove'],
      filters: { $nor: true, $and: true },
      operators: ['$nor', '$and', '$regex']
    }, mockApp);
  });

  describe('service registration', () => {
    it('registered the service', () => {
      const registeredService = app.service('interview');
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

    it('should set collection name to interviews', () => {
      assert.strictEqual(service.collectionName, 'interviews');
    });

    it('should support multi remove option', () => {
      assert.ok(service.options.multi);
      assert.ok(service.options.multi.includes('remove'));
    });

    it('should support custom filters', () => {
      assert.ok(service.options.filters);
      assert.strictEqual(service.options.filters.$nor, true);
      assert.strictEqual(service.options.filters.$and, true);
    });

    it('should support custom operators', () => {
      assert.ok(Array.isArray(service.options.operators));
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
      assert.strictEqual(requestedName, 'interviews');
    });
  });

  describe('interview structure', () => {
    it('should handle interviews with required fields', async () => {
      const interview = {
        _id: 'interview1',
        code: 'INT-001',
        identifier: 'PART-001',
        participant: 'participant1',
        campaign: 'campaign1',
        study: 'study1',
        interviewDesign: 'itwd1',
        state: 'initiated',
        steps: [],
        data: {},
        createdBy: 'user1',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCollection.findOne = async () => interview;

      const result = await service._get('interview1', {});
      
      assert.strictEqual(result.code, 'INT-001');
      assert.strictEqual(result.identifier, 'PART-001');
      assert.strictEqual(result.participant, 'participant1');
      assert.strictEqual(result.campaign, 'campaign1');
      assert.strictEqual(result.state, 'initiated');
      assert.ok(Array.isArray(result.steps));
      assert.ok(typeof result.data === 'object');
    });

    it('should handle interviews with steps', async () => {
      const interview = {
        _id: 'interview1',
        code: 'INT-002',
        participant: 'participant1',
        campaign: 'campaign1',
        state: 'in_progress',
        steps: [
          {
            name: 'Step 1',
            form: 'form1',
            revision: 1,
            state: 'completed',
            actions: [
              {
                type: 'complete',
                user: 'user1',
                timestamp: Date.now()
              }
            ],
            data: { field1: 'value1' }
          },
          {
            name: 'Step 2',
            form: 'form2',
            revision: 2,
            state: 'in_progress',
            actions: [],
            data: {}
          }
        ],
        data: {}
      };

      mockCollection.findOne = async () => interview;

      const result = await service._get('interview1', {});
      
      assert.strictEqual(result.steps.length, 2);
      assert.strictEqual(result.steps[0].name, 'Step 1');
      assert.strictEqual(result.steps[0].state, 'completed');
      assert.strictEqual(result.steps[0].actions.length, 1);
      assert.strictEqual(result.steps[0].actions[0].type, 'complete');
      assert.strictEqual(result.steps[1].state, 'in_progress');
    });

    it('should handle interviews with actions', async () => {
      const interview = {
        _id: 'interview1',
        code: 'INT-003',
        participant: 'participant1',
        campaign: 'campaign1',
        state: 'in_progress',
        steps: [
          {
            name: 'Step 1',
            form: 'form1',
            revision: 1,
            state: 'in_progress',
            actions: [
              {
                type: 'start',
                user: 'user1',
                timestamp: Date.now() - 1000
              },
              {
                type: 'save',
                user: 'user1',
                timestamp: Date.now()
              }
            ],
            data: { field1: 'value1', field2: 'value2' }
          }
        ],
        data: {}
      };

      mockCollection.findOne = async () => interview;

      const result = await service._get('interview1', {});
      
      assert.strictEqual(result.steps[0].actions.length, 2);
      assert.strictEqual(result.steps[0].actions[0].type, 'start');
      assert.strictEqual(result.steps[0].actions[1].type, 'save');
      assert.ok(result.steps[0].actions[0].timestamp);
    });

    it('should handle interviews with different states', async () => {
      const states = ['initiated', 'in_progress', 'completed', 'cancelled'];

      for (const state of states) {
        const interview = {
          _id: 'interview1',
          code: 'INT-004',
          participant: 'participant1',
          campaign: 'campaign1',
          state: state,
          steps: [],
          data: {}
        };

        mockCollection.findOne = async () => interview;

        const result = await service._get('interview1', {});
        assert.strictEqual(result.state, state);
      }
    });

    it('should handle interviews with optional identifier', async () => {
      const interview = {
        _id: 'interview1',
        code: 'INT-005',
        identifier: '',
        participant: 'participant1',
        campaign: 'campaign1',
        state: 'initiated',
        steps: [],
        data: {}
      };

      mockCollection.findOne = async () => interview;

      const result = await service._get('interview1', {});
      
      assert.strictEqual(result.identifier, '');
      assert.strictEqual(result.code, 'INT-005');
    });

    it('should handle interviews with fillingDate', async () => {
      const fillingDate = new Date('2024-01-15');
      const interview = {
        _id: 'interview1',
        code: 'INT-006',
        participant: 'participant1',
        campaign: 'campaign1',
        state: 'completed',
        steps: [],
        data: {},
        fillingDate: fillingDate
      };

      mockCollection.findOne = async () => interview;

      const result = await service._get('interview1', {});
      
      assert.ok(result.fillingDate);
      assert.strictEqual(result.fillingDate.getTime(), fillingDate.getTime());
    });

    it('should handle interviews with nested data', async () => {
      const interview = {
        _id: 'interview1',
        code: 'INT-007',
        participant: 'participant1',
        campaign: 'campaign1',
        state: 'in_progress',
        steps: [
          {
            name: 'Demographics',
            form: 'form1',
            revision: 1,
            state: 'completed',
            actions: [],
            data: {
              age: 30,
              gender: 'male',
              address: {
                street: '123 Main St',
                city: 'Boston',
                zip: '02101'
              }
            }
          }
        ],
        data: {
          metadata: {
            source: 'web',
            device: 'desktop'
          }
        }
      };

      mockCollection.findOne = async () => interview;

      const result = await service._get('interview1', {});
      
      assert.strictEqual(result.steps[0].data.age, 30);
      assert.ok(result.steps[0].data.address);
      assert.strictEqual(result.steps[0].data.address.city, 'Boston');
      assert.ok(result.data.metadata);
      assert.strictEqual(result.data.metadata.source, 'web');
    });

    it('should handle interviews with empty steps array', async () => {
      const interview = {
        _id: 'interview1',
        code: 'INT-008',
        participant: 'participant1',
        campaign: 'campaign1',
        state: 'initiated',
        steps: [],
        data: {}
      };

      mockCollection.findOne = async () => interview;

      const result = await service._get('interview1', {});
      
      assert.ok(Array.isArray(result.steps));
      assert.strictEqual(result.steps.length, 0);
    });

    it('should handle interviews with multiple completed steps', async () => {
      const interview = {
        _id: 'interview1',
        code: 'INT-009',
        participant: 'participant1',
        campaign: 'campaign1',
        state: 'completed',
        steps: [
          {
            name: 'Step 1',
            form: 'form1',
            revision: 1,
            state: 'completed',
            actions: [{ type: 'complete', user: 'user1', timestamp: Date.now() }],
            data: { q1: 'answer1' }
          },
          {
            name: 'Step 2',
            form: 'form2',
            revision: 1,
            state: 'completed',
            actions: [{ type: 'complete', user: 'user1', timestamp: Date.now() }],
            data: { q2: 'answer2' }
          },
          {
            name: 'Step 3',
            form: 'form3',
            revision: 1,
            state: 'completed',
            actions: [{ type: 'complete', user: 'user1', timestamp: Date.now() }],
            data: { q3: 'answer3' }
          }
        ],
        data: {},
        fillingDate: new Date()
      };

      mockCollection.findOne = async () => interview;

      const result = await service._get('interview1', {});
      
      assert.strictEqual(result.state, 'completed');
      assert.strictEqual(result.steps.length, 3);
      assert.ok(result.steps.every(step => step.state === 'completed'));
      assert.ok(result.fillingDate);
    });
  });

  describe('lazy loading behavior', () => {
    it('should load model before _find', async () => {
      await service._find({});
      assert.ok(service.Model);
      assert.strictEqual(service.Model, mockCollection);
    });

    it('should load model before _get', async () => {
      mockCollection.findOne = async () => ({ _id: 'interview1', code: 'INT-001' });
      await service._get('interview1', {});
      assert.ok(service.Model);
    });

    it('should load model before _create', async () => {
      const newInterview = {
        code: 'INT-NEW',
        participant: 'participant1',
        campaign: 'campaign1',
        state: 'initiated',
        steps: [],
        data: {}
      };

      mockCollection.insertOne = async () => ({ insertedId: 'interview123', acknowledged: true });
      mockCollection.findOne = async () => ({ _id: 'interview123', ...newInterview });

      await service._create(newInterview, {});
      assert.ok(service.Model);
    });

    it('should load model before _patch', async () => {
      mockCollection.findOneAndUpdate = async () => ({
        value: { _id: 'interview1', code: 'INT-001', state: 'in_progress' }
      });

      await service._patch('interview1', { state: 'in_progress' }, {});
      assert.ok(service.Model);
    });

    it('should load model before _remove', async () => {
      mockCollection.findOneAndDelete = async () => ({
        value: { _id: 'interview1', code: 'INT-001' }
      });

      await service._remove('interview1', {});
      assert.ok(service.Model);
    });
  });
});
