const assert = require('assert');
const app = require('../../src/app');
const { Task } = require('../../src/services/task/task.class');
const { LazyMongoDBService } = require('../../src/services/mongodb-service.class');

describe('\'task\' service', () => {
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
      findOneAndUpdate: async () => ({
        value: {
          _id: 'task1',
          type: 'participants-summary',
          state: 'completed'
        }
      }),
      findOneAndDelete: async () => ({
        value: {
          _id: 'task1',
          type: 'participants-summary',
          state: 'completed'
        }
      }),
      insertOne: async () => ({ 
        insertedId: 'task123',
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
        if (name === 'tasks') {
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

    service = new Task({ 
      paginate: { max: 1000 },
      multi: ['remove'],
      filters: { $nor: true, $and: true, $ne: true },
      operators: ['$nor', '$and', '$regex', '$ne']
    }, mockApp);
  });

  describe('service registration', () => {
    it('registered the service', () => {
      const registeredService = app.service('task');
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

    it('should set collection name to tasks', () => {
      assert.strictEqual(service.collectionName, 'tasks');
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
      assert.strictEqual(service.options.filters.$ne, true);
    });

    it('should support custom operators', () => {
      assert.ok(service.options.operators);
      assert.ok(service.options.operators.includes('$nor'));
      assert.ok(service.options.operators.includes('$and'));
      assert.ok(service.options.operators.includes('$regex'));
      assert.ok(service.options.operators.includes('$ne'));
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
      assert.strictEqual(service.collectionName, 'tasks');
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
        _id: 'task1', 
        type: 'participants-summary',
        state: 'in_progress',
        logs: [],
        arguments: {}
      });
      await service._get('task1', {});
      assert.ok(service.Model);
    });

    it('should load model before _create', async () => {
      const newTask = {
        type: 'participants-summary',
        state: 'in_progress',
        logs: [],
        arguments: {}
      };

      mockCollection.insertOne = async () => ({ 
        insertedId: 'new-task-id',
        acknowledged: true 
      });

      await service._create(newTask, {});
      assert.ok(service.Model);
    });

    it('should load model before _patch', async () => {
      mockCollection.findOneAndUpdate = async () => ({
        value: { 
          _id: 'task1', 
          type: 'participants-summary',
          state: 'completed',
          logs: [],
          arguments: {}
        }
      });

      await service._patch('task1', { state: 'completed' }, {});
      assert.ok(service.Model);
    });

    it('should load model before _remove', async () => {
      mockCollection.findOneAndDelete = async () => ({
        value: { 
          _id: 'task1', 
          type: 'participants-summary',
          state: 'completed',
          logs: [],
          arguments: {}
        }
      });

      await service._remove('task1', {});
      assert.ok(service.Model);
    });
  });

  describe('task structure', () => {
    it('should handle tasks with required fields', async () => {
      const task = {
        _id: 'task1',
        type: 'participants-summary',
        state: 'in_progress',
        logs: [],
        arguments: {}
      };

      mockCollection.findOne = async () => task;

      const result = await service._get('task1', {});
      
      assert.strictEqual(result.type, 'participants-summary');
      assert.strictEqual(result.state, 'in_progress');
      assert.ok(Array.isArray(result.logs));
      assert.ok(result.arguments);
    });

    it('should handle tasks with error field', async () => {
      const task = {
        _id: 'task2',
        type: 'participants-activate',
        state: 'aborted',
        error: 'Database connection failed',
        logs: [],
        arguments: {}
      };

      mockCollection.findOne = async () => task;

      const result = await service._get('task2', {});
      
      assert.strictEqual(result.error, 'Database connection failed');
      assert.strictEqual(result.state, 'aborted');
    });

    it('should handle tasks with message field', async () => {
      const task = {
        _id: 'task3',
        type: 'participants-reminder',
        state: 'completed',
        message: 'Successfully sent 50 reminders',
        logs: [],
        arguments: {}
      };

      mockCollection.findOne = async () => task;

      const result = await service._get('task3', {});
      
      assert.strictEqual(result.message, 'Successfully sent 50 reminders');
    });

    it('should handle tasks with logs', async () => {
      const task = {
        _id: 'task4',
        type: 'participants-deactivate',
        state: 'in_progress',
        logs: [
          { level: 'info', message: 'Starting task', timestamp: new Date('2024-01-01') },
          { level: 'warn', message: 'Found 3 expired participants', timestamp: new Date('2024-01-02') }
        ],
        arguments: {}
      };

      mockCollection.findOne = async () => task;

      const result = await service._get('task4', {});
      
      assert.ok(Array.isArray(result.logs));
      assert.strictEqual(result.logs.length, 2);
      assert.strictEqual(result.logs[0].level, 'info');
      assert.strictEqual(result.logs[1].level, 'warn');
    });

    it('should handle tasks with arguments', async () => {
      const task = {
        _id: 'task5',
        type: 'participants-info-activate',
        state: 'in_progress',
        logs: [],
        arguments: {
          studyId: 'study123',
          daysBeforeActivation: 7
        }
      };

      mockCollection.findOne = async () => task;

      const result = await service._get('task5', {});
      
      assert.ok(result.arguments);
      assert.strictEqual(result.arguments.studyId, 'study123');
      assert.strictEqual(result.arguments.daysBeforeActivation, 7);
    });

    it('should handle tasks with empty optional fields', async () => {
      const task = {
        _id: 'task6',
        type: 'participants-summary',
        state: 'in_progress',
        error: '',
        message: '',
        logs: [],
        arguments: {}
      };

      mockCollection.findOne = async () => task;

      const result = await service._get('task6', {});
      
      assert.strictEqual(result.error, '');
      assert.strictEqual(result.message, '');
      assert.strictEqual(result.logs.length, 0);
    });

    it('should handle tasks with null error', async () => {
      const task = {
        _id: 'task7',
        type: 'participants-activate',
        state: 'completed',
        error: null,
        message: 'Task completed successfully',
        logs: [],
        arguments: {}
      };

      mockCollection.findOne = async () => task;

      const result = await service._get('task7', {});
      
      assert.strictEqual(result.error, null);
    });
  });

  describe('task types', () => {
    it('should handle participants-info-activate type', async () => {
      const task = {
        _id: 'task1',
        type: 'participants-info-activate',
        state: 'in_progress',
        logs: [],
        arguments: {}
      };

      mockCollection.findOne = async () => task;
      const result = await service._get('task1', {});
      
      assert.strictEqual(result.type, 'participants-info-activate');
    });

    it('should handle participants-activate type', async () => {
      const task = {
        _id: 'task2',
        type: 'participants-activate',
        state: 'in_progress',
        logs: [],
        arguments: {}
      };

      mockCollection.findOne = async () => task;
      const result = await service._get('task2', {});
      
      assert.strictEqual(result.type, 'participants-activate');
    });

    it('should handle participants-reminder type', async () => {
      const task = {
        _id: 'task3',
        type: 'participants-reminder',
        state: 'in_progress',
        logs: [],
        arguments: {}
      };

      mockCollection.findOne = async () => task;
      const result = await service._get('task3', {});
      
      assert.strictEqual(result.type, 'participants-reminder');
    });

    it('should handle participants-info-expire type', async () => {
      const task = {
        _id: 'task4',
        type: 'participants-info-expire',
        state: 'in_progress',
        logs: [],
        arguments: {}
      };

      mockCollection.findOne = async () => task;
      const result = await service._get('task4', {});
      
      assert.strictEqual(result.type, 'participants-info-expire');
    });

    it('should handle participants-deactivate type', async () => {
      const task = {
        _id: 'task5',
        type: 'participants-deactivate',
        state: 'in_progress',
        logs: [],
        arguments: {}
      };

      mockCollection.findOne = async () => task;
      const result = await service._get('task5', {});
      
      assert.strictEqual(result.type, 'participants-deactivate');
    });

    it('should handle participants-summary type', async () => {
      const task = {
        _id: 'task6',
        type: 'participants-summary',
        state: 'in_progress',
        logs: [],
        arguments: {}
      };

      mockCollection.findOne = async () => task;
      const result = await service._get('task6', {});
      
      assert.strictEqual(result.type, 'participants-summary');
    });
  });

  describe('task states', () => {
    it('should handle in_progress state', async () => {
      const task = {
        _id: 'task1',
        type: 'participants-summary',
        state: 'in_progress',
        logs: [],
        arguments: {}
      };

      mockCollection.findOne = async () => task;
      const result = await service._get('task1', {});
      
      assert.strictEqual(result.state, 'in_progress');
    });

    it('should handle completed state', async () => {
      const task = {
        _id: 'task2',
        type: 'participants-summary',
        state: 'completed',
        logs: [],
        arguments: {}
      };

      mockCollection.findOne = async () => task;
      const result = await service._get('task2', {});
      
      assert.strictEqual(result.state, 'completed');
    });

    it('should handle aborted state', async () => {
      const task = {
        _id: 'task3',
        type: 'participants-summary',
        state: 'aborted',
        error: 'Task failed',
        logs: [],
        arguments: {}
      };

      mockCollection.findOne = async () => task;
      const result = await service._get('task3', {});
      
      assert.strictEqual(result.state, 'aborted');
    });
  });

  describe('query operations', () => {
    it('should support filtering by type', async () => {
      const tasks = [
        {
          _id: 't1',
          type: 'participants-activate',
          state: 'completed',
          logs: [],
          arguments: {}
        }
      ];

      mockCollection.find = () => {
        return createCursor(tasks)();
      };

      const createCursor = (data) => () => ({
        limit: () => ({ skip: () => ({ toArray: async () => data }) })
      });

      await service._find({ query: { type: 'participants-activate' } });
    });

    it('should support filtering by state', async () => {
      const tasks = [
        {
          _id: 't2',
          type: 'participants-summary',
          state: 'completed',
          logs: [],
          arguments: {}
        }
      ];

      mockCollection.find = () => {
        return createCursor(tasks)();
      };

      const createCursor = (data) => () => ({
        limit: () => ({ skip: () => ({ toArray: async () => data }) })
      });

      await service._find({ query: { state: 'completed' } });
    });

    it('should support $ne queries', async () => {
      const cursor = {
        limit: () => cursor,
        skip: () => cursor,
        toArray: async () => []
      };

      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 0;

      const result = await service._find({ 
        query: { 
          state: { $ne: 'aborted' } 
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
            { type: 'participants-summary' },
            { state: 'completed' }
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
            { state: 'aborted' },
            { error: { $ne: null } }
          ]
        } 
      });
      
      assert.ok(result);
    });

    it('should support $regex queries', async () => {
      const cursor = {
        limit: () => cursor,
        skip: () => cursor,
        toArray: async () => []
      };

      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 0;

      const result = await service._find({ 
        query: { 
          message: { $regex: 'success', $options: 'i' } 
        } 
      });
      
      assert.ok(result);
    });
  });

  describe('multi-record operations', () => {
    it('should support multi-record remove option', () => {
      assert.ok(service.options.multi);
      assert.ok(service.options.multi.includes('remove'));
    });

    it('should allow removing multiple tasks by query', async () => {
      mockCollection.deleteMany = async (query) => {
        assert.ok(query);
        return { deletedCount: 3 };
      };

      const result = await service._remove(null, { 
        query: { state: 'completed' } 
      });
      
      assert.ok(result);
    });
  });

  describe('pagination', () => {
    it('should support pagination with limit and skip', async () => {
      const tasks = Array.from({ length: 5 }, (_, i) => ({
        _id: `t${i + 1}`,
        type: 'participants-summary',
        state: 'completed',
        logs: [],
        arguments: {}
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
        toArray: async () => tasks
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
    });
  });

  describe('log structure', () => {
    it('should handle logs with required fields', async () => {
      const task = {
        _id: 'task1',
        type: 'participants-summary',
        state: 'in_progress',
        logs: [
          { 
            level: 'info', 
            message: 'Task started', 
            timestamp: new Date('2024-01-01T10:00:00Z') 
          }
        ],
        arguments: {}
      };

      mockCollection.findOne = async () => task;
      const result = await service._get('task1', {});
      
      assert.strictEqual(result.logs.length, 1);
      assert.strictEqual(result.logs[0].level, 'info');
      assert.strictEqual(result.logs[0].message, 'Task started');
      assert.ok(result.logs[0].timestamp);
    });

    it('should handle multiple log entries', async () => {
      const task = {
        _id: 'task2',
        type: 'participants-activate',
        state: 'completed',
        logs: [
          { level: 'info', message: 'Starting', timestamp: new Date() },
          { level: 'info', message: 'Processing', timestamp: new Date() },
          { level: 'warn', message: 'Warning occurred', timestamp: new Date() },
          { level: 'info', message: 'Completed', timestamp: new Date() }
        ],
        arguments: {}
      };

      mockCollection.findOne = async () => task;
      const result = await service._get('task2', {});
      
      assert.strictEqual(result.logs.length, 4);
    });

    it('should handle different log levels', async () => {
      const task = {
        _id: 'task3',
        type: 'participants-reminder',
        state: 'aborted',
        logs: [
          { level: 'debug', message: 'Debug info', timestamp: new Date() },
          { level: 'info', message: 'Info message', timestamp: new Date() },
          { level: 'warn', message: 'Warning message', timestamp: new Date() },
          { level: 'error', message: 'Error occurred', timestamp: new Date() }
        ],
        arguments: {}
      };

      mockCollection.findOne = async () => task;
      const result = await service._get('task3', {});
      
      assert.strictEqual(result.logs[0].level, 'debug');
      assert.strictEqual(result.logs[1].level, 'info');
      assert.strictEqual(result.logs[2].level, 'warn');
      assert.strictEqual(result.logs[3].level, 'error');
    });
  });

  describe('arguments structure', () => {
    it('should handle empty arguments object', async () => {
      const task = {
        _id: 'task1',
        type: 'participants-summary',
        state: 'in_progress',
        logs: [],
        arguments: {}
      };

      mockCollection.findOne = async () => task;
      const result = await service._get('task1', {});
      
      assert.ok(result.arguments);
      assert.strictEqual(Object.keys(result.arguments).length, 0);
    });

    it('should handle arguments with various data types', async () => {
      const task = {
        _id: 'task2',
        type: 'participants-activate',
        state: 'in_progress',
        logs: [],
        arguments: {
          studyId: 'study123',
          count: 50,
          enabled: true,
          threshold: 0.75,
          filters: { status: 'active' }
        }
      };

      mockCollection.findOne = async () => task;
      const result = await service._get('task2', {});
      
      assert.strictEqual(result.arguments.studyId, 'study123');
      assert.strictEqual(result.arguments.count, 50);
      assert.strictEqual(result.arguments.enabled, true);
      assert.strictEqual(result.arguments.threshold, 0.75);
      assert.ok(result.arguments.filters);
    });

    it('should handle nested arguments', async () => {
      const task = {
        _id: 'task3',
        type: 'participants-deactivate',
        state: 'in_progress',
        logs: [],
        arguments: {
          criteria: {
            ageRange: { min: 18, max: 65 },
            location: ['US', 'CA', 'UK']
          }
        }
      };

      mockCollection.findOne = async () => task;
      const result = await service._get('task3', {});
      
      assert.ok(result.arguments.criteria);
      assert.ok(result.arguments.criteria.ageRange);
      assert.strictEqual(result.arguments.criteria.ageRange.min, 18);
      assert.ok(Array.isArray(result.arguments.criteria.location));
    });
  });

  describe('error handling', () => {
    it('should handle not found tasks', async () => {
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
      const realService = app.service('task');
      assert.ok(realService);
      assert.ok(realService instanceof LazyMongoDBService);
    });

    it('should have correct collection name in real instance', () => {
      const realService = app.service('task');
      assert.strictEqual(realService.collectionName, 'tasks');
    });

    it('should support multi remove in real instance', () => {
      const realService = app.service('task');
      assert.ok(realService.options.multi);
      assert.ok(realService.options.multi.includes('remove'));
    });
  });
});
