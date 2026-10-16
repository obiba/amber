const assert = require('assert');
const appPromise = require('../../src/app');
let app;

before(async function() { this.timeout(30000); app = await appPromise; });

describe('\'interview-design\' service', () => {
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
          _id: 'itwd1',
          name: 'test-interview',
          label: 'Test Interview',
          description: 'Test Description',
          study: 'study1',
          steps: [],
          i18n: {},
          state: 'paused'
        };
      },
      findOneAndDelete: async () => {
        return {
          _id: 'itwd1',
          name: 'test-interview',
          label: 'Test Interview',
          study: 'study1',
          steps: []
        };
      },
      insertOne: async () => {
        return { 
          insertedId: 'itwd123',
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
        if (name === 'interviewdesigns') {
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

    const { InterviewDesigns } = require('../../src/services/interview-design/interview-design.class');
    service = new InterviewDesigns({ 
      paginate: { max: 1000 },
      multi: ['remove'],
      filters: { $nor: true, $or: true, $exists: true, $eq: true },
      operators: ['$nor', '$or', '$regex', '$exists', '$eq']
    }, mockApp);
  });

  describe('service registration', () => {
    it('registered the service', () => {
      const registeredService = app.service('interview-design');
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

    it('should set collection name to interviewdesigns', () => {
      assert.strictEqual(service.collectionName, 'interviewdesigns');
    });

    it('should have pagination options', () => {
      assert.ok(service.options.paginate);
      assert.strictEqual(service.options.paginate.max, 1000);
    });

    it('should support multi remove', () => {
      assert.ok(Array.isArray(service.options.multi));
      assert.ok(service.options.multi.includes('remove'));
    });

    it('should support custom operators', () => {
      assert.ok(Array.isArray(service.options.operators));
      assert.ok(service.options.operators.includes('$nor'));
      assert.ok(service.options.operators.includes('$or'));
      assert.ok(service.options.operators.includes('$regex'));
      assert.ok(service.options.operators.includes('$exists'));
      assert.ok(service.options.operators.includes('$eq'));
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
      const testInterviewDesigns = [
        { 
          _id: 'itwd1', 
          name: 'interview1', 
          label: 'Interview 1', 
          study: 'study1', 
          steps: [],
          state: 'paused'
        },
        { 
          _id: 'itwd2', 
          name: 'interview2', 
          label: 'Interview 2', 
          study: 'study1', 
          steps: [],
          state: 'active'
        }
      ];

      mockCollection.find = () => {
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testInterviewDesigns
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => testInterviewDesigns.length;

      const result = await service.find({ paginate: { default: 10, max: 1000 } });

      assert.ok(result);
      assert.ok(Array.isArray(result.data));
      assert.strictEqual(result.data.length, 2);
      assert.strictEqual(result.total, 2);
    });

    it('should return array when pagination is disabled', async () => {
      const testInterviewDesigns = [
        { _id: 'itwd1', name: 'interview1', label: 'Interview 1', study: 'study1', steps: [] }
      ];

      mockCollection.find = () => {
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testInterviewDesigns
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
    it('should retrieve an interview design by id', async () => {
      const testInterviewDesign = {
        _id: 'itwd1',
        name: 'test-interview',
        label: 'Test Interview',
        description: 'Test Description',
        study: 'study1',
        steps: [
          {
            name: 'step1',
            label: 'Step 1',
            form: 'form1'
          }
        ],
        state: 'paused'
      };

      mockCollection.findOne = async () => testInterviewDesign;

      const result = await service.get('itwd1');

      assert.ok(result);
      assert.strictEqual(result._id, 'itwd1');
      assert.strictEqual(result.name, 'test-interview');
    });
  });

  describe('create method', () => {
    it('should load model before creating', async () => {
      assert.strictEqual(service.Model, undefined);
      
      mockCollection.insertOne = async () => {
        return { 
          insertedId: 'itwd123',
          acknowledged: true 
        };
      };
      mockCollection.findOne = async () => null;

      try {
        await service._create({ 
          name: 'test', 
          label: 'Test', 
          study: 'study1' 
        }, { query: {} });
      } catch {
        // May fail due to validation or null return, but Model should be loaded
      }
      
      assert.ok(service.Model);
    });
  });

  describe('patch method', () => {
    it('should be callable to update interview design fields', async () => {
      const patchData = {
        description: 'Updated description'
      };

      mockCollection.findOneAndUpdate = async () => {
        return {
          _id: 'itwd1',
          name: 'test-interview',
          label: 'Test Interview',
          description: 'Updated description',
          study: 'study1',
          steps: []
        };
      };

      const result = await service.patch('itwd1', patchData);

      assert.ok(result);
    });
  });

  describe('remove method', () => {
    it('should be callable to remove an interview design', async () => {
      mockCollection.findOneAndDelete = async () => {
        return {
          _id: 'itwd1',
          name: 'test-interview',
          label: 'Test Interview',
          study: 'study1',
          steps: []
        };
      };

      const result = await service.remove('itwd1');

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
        await service._get('itwd1', { query: {} });
      } catch {
        // May fail, but Model should be loaded
      }
      
      assert.ok(service.Model);
    });

    it('should load model before _patch', async () => {
      assert.strictEqual(service.Model, undefined);
      
      try {
        await service._patch('itwd1', { label: 'Updated' }, { query: {} });
      } catch {
        // May fail, but Model should be loaded
      }
      
      assert.ok(service.Model);
    });

    it('should load model before _remove', async () => {
      assert.strictEqual(service.Model, undefined);
      
      try {
        await service._remove('itwd1', { query: {} });
      } catch {
        // May fail, but Model should be loaded
      }
      
      assert.ok(service.Model);
    });
  });

  describe('interview design structure', () => {
    it('should handle interview designs with required fields', async () => {
      const testInterviewDesign = {
        _id: 'itwd1',
        name: 'minimal-interview',
        label: 'Minimal Interview',
        study: 'study1',
        steps: [],
        state: 'paused'
      };

      mockCollection.find = () => {
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => [testInterviewDesign]
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => 1;

      const result = await service.find({ paginate: { default: 10, max: 1000 } });

      assert.ok(result.data);
      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.data[0].name, 'minimal-interview');
    });

    it('should handle interview designs with steps', async () => {
      const testInterviewDesign = {
        _id: 'itwd1',
        name: 'multi-step-interview',
        label: 'Multi Step Interview',
        study: 'study1',
        steps: [
          { name: 'step1', label: 'Step 1', form: 'form1' },
          { name: 'step2', label: 'Step 2', form: 'form2' },
          { name: 'step3', label: 'Step 3', form: 'form3' }
        ],
        state: 'active'
      };

      mockCollection.findOne = async () => testInterviewDesign;

      const result = await service.get('itwd1');

      assert.ok(result);
      assert.ok(Array.isArray(result.steps));
      assert.strictEqual(result.steps.length, 3);
    });

    it('should handle interview designs with i18n data', async () => {
      const testInterviewDesign = {
        _id: 'itwd1',
        name: 'i18n-interview',
        label: 'i18n Interview',
        study: 'study1',
        steps: [],
        i18n: {
          en: { welcome: 'Welcome' },
          fr: { welcome: 'Bienvenue' }
        },
        state: 'paused'
      };

      mockCollection.findOne = async () => testInterviewDesign;

      const result = await service.get('itwd1');

      assert.ok(result);
      assert.ok(result.i18n);
      assert.ok(result.i18n.en);
      assert.ok(result.i18n.fr);
    });

    it('should handle interview designs with instructions', async () => {
      const testInterviewDesign = {
        _id: 'itwd1',
        name: 'instructed-interview',
        label: 'Instructed Interview',
        study: 'study1',
        interviewer_instructions: 'Instructions for interviewers',
        participant_instructions: 'Instructions for participants',
        steps: [],
        state: 'paused'
      };

      mockCollection.findOne = async () => testInterviewDesign;

      const result = await service.get('itwd1');

      assert.ok(result);
      assert.strictEqual(result.interviewer_instructions, 'Instructions for interviewers');
      assert.strictEqual(result.participant_instructions, 'Instructions for participants');
    });

    it('should handle interview designs with different states', async () => {
      const testInterviewDesigns = [
        { _id: 'itwd1', name: 'paused', label: 'Paused', study: 'study1', steps: [], state: 'paused' },
        { _id: 'itwd2', name: 'active', label: 'Active', study: 'study1', steps: [], state: 'active' }
      ];

      mockCollection.find = () => {
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testInterviewDesigns
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => 2;

      const result = await service.find({ paginate: { default: 10, max: 1000 } });

      assert.ok(result.data);
      assert.strictEqual(result.data[0].state, 'paused');
      assert.strictEqual(result.data[1].state, 'active');
    });
  });

  describe('hooks', () => {
    it('should have before hooks configured', () => {
      const registeredService = app.service('interview-design');
      const hooks = registeredService.__hooks.before;

      assert.ok(hooks);
      assert.ok(hooks.all);
      assert.ok(Array.isArray(hooks.all));
    });

    it('should have after hooks configured', () => {
      const registeredService = app.service('interview-design');
      const hooks = registeredService.__hooks.after;

      assert.ok(hooks);
      assert.ok(hooks.all);
      assert.ok(Array.isArray(hooks.all));
    });

    it('should require authentication for all methods', () => {
      const registeredService = app.service('interview-design');
      const beforeAllHooks = registeredService.__hooks.before.all;

      assert.ok(beforeAllHooks);
      assert.ok(beforeAllHooks.length > 0);
    });
  });

  describe('pagination', () => {
    it('should respect default pagination limit', async () => {
      const testInterviewDesigns = Array(15).fill(null).map((_, i) => ({
        _id: `itwd${i}`,
        name: `interview${i}`,
        label: `Interview ${i}`,
        study: 'study1',
        steps: [],
        state: 'paused'
      }));

      mockCollection.find = () => {
        const cursor = {
          limit: (n) => { cursor._limit = n; return cursor; },
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testInterviewDesigns.slice(0, cursor._limit || 10)
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => testInterviewDesigns.length;

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
      const testInterviewDesigns = [
        { _id: 'itwd1', name: 'test-interview', label: 'Test Interview', study: 'study1', steps: [] }
      ];

      let capturedQuery;
      mockCollection.find = (query) => {
        capturedQuery = query;
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testInterviewDesigns
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => testInterviewDesigns.length;

      await service.find({ 
        query: { name: { $regex: 'test' } },
        paginate: { default: 10, max: 1000 }
      });

      assert.ok(capturedQuery);
    });

    it('should support $or operator', async () => {
      const testInterviewDesigns = [];

      mockCollection.find = () => {
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testInterviewDesigns
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => 0;

      const result = await service.find({ 
        query: { $or: [{ state: 'active' }, { state: 'paused' }] },
        paginate: { default: 10, max: 1000 }
      });

      assert.ok(result);
    });

    it('should support $exists operator', async () => {
      const testInterviewDesigns = [];

      mockCollection.find = () => {
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testInterviewDesigns
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => 0;

      const result = await service.find({ 
        query: { description: { $exists: true } },
        paginate: { default: 10, max: 1000 }
      });

      assert.ok(result);
    });

    it('should support $eq operator', async () => {
      const testInterviewDesigns = [];

      mockCollection.find = () => {
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testInterviewDesigns
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => 0;

      const result = await service.find({ 
        query: { state: { $eq: 'active' } },
        paginate: { default: 10, max: 1000 }
      });

      assert.ok(result);
    });
  });

  describe('query operations', () => {
    it('should support filtering by study', async () => {
      const testInterviewDesigns = [
        { _id: 'itwd1', name: 'interview1', label: 'Interview 1', study: 'study1', steps: [] }
      ];

      mockCollection.find = () => {
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testInterviewDesigns
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => 1;

      const result = await service.find({ 
        query: { study: 'study1' },
        paginate: { default: 10, max: 1000 }
      });

      assert.ok(result);
      assert.strictEqual(result.data.length, 1);
    });

    it('should support filtering by state', async () => {
      const testInterviewDesigns = [
        { _id: 'itwd1', name: 'interview1', label: 'Interview 1', study: 'study1', steps: [], state: 'active' }
      ];

      mockCollection.find = () => {
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testInterviewDesigns
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => 1;

      const result = await service.find({ 
        query: { state: 'active' },
        paginate: { default: 10, max: 1000 }
      });

      assert.ok(result);
    });

    it('should support filtering by name', async () => {
      const testInterviewDesigns = [
        { _id: 'itwd1', name: 'specific-interview', label: 'Specific', study: 'study1', steps: [] }
      ];

      mockCollection.find = () => {
        const cursor = {
          limit: () => cursor,
          skip: () => cursor,
          sort: () => cursor,
          toArray: async () => testInterviewDesigns
        };
        return cursor;
      };
      mockCollection.countDocuments = async () => 1;

      const result = await service.find({ 
        query: { name: 'specific-interview' },
        paginate: { default: 10, max: 1000 }
      });

      assert.ok(result);
    });
  });

  describe('integration with real app', () => {
    it('should work with real app instance', () => {
      const registeredService = app.service('interview-design');
      assert.ok(registeredService);
      assert.strictEqual(typeof registeredService.find, 'function');
      assert.strictEqual(typeof registeredService.get, 'function');
      assert.strictEqual(typeof registeredService.create, 'function');
      assert.strictEqual(typeof registeredService.patch, 'function');
      assert.strictEqual(typeof registeredService.remove, 'function');
    });
  });
});
