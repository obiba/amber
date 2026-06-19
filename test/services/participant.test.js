const assert = require('assert');
const appPromise = require('../../src/app');
let app;
const { Participant } = require('../../src/services/participant/participant.class');
const { LazyMongoDBService } = require('../../src/services/mongodb-service.class');

before(async function() { this.timeout(30000); app = await appPromise; });

describe('\'participant\' service', () => {
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
          _id: 'participant1',
          code: 'P001'
        }
      }),
      findOneAndDelete: async () => ({
        value: {
          _id: 'participant1',
          code: 'P001'
        }
      }),
      insertOne: async () => ({ 
        insertedId: 'participant123',
        acknowledged: true 
      }),
      insertMany: async (docs) => ({
        insertedIds: docs.map((d, i) => `participant_${i}`),
        insertedCount: docs.length,
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
        if (name === 'participants') {
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

    service = new Participant({ 
      paginate: { max: 1000 },
      multi: ['create', 'patch', 'remove'],
      filters: { $nor: true, $or: true, $exists: true, $eq: true },
      operators: ['$nor', '$or', '$regex', '$exists', '$eq']
    }, mockApp);
  });

  describe('service registration', () => {
    it('registered the service', () => {
      const registeredService = app.service('participant');
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

    it('should set collection name to participants', () => {
      assert.strictEqual(service.collectionName, 'participants');
    });

    it('should support multi create option', () => {
      assert.ok(service.options.multi);
      assert.ok(service.options.multi.includes('create'));
    });

    it('should support multi patch option', () => {
      assert.ok(service.options.multi);
      assert.ok(service.options.multi.includes('patch'));
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
      assert.strictEqual(service.options.filters.$eq, true);
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

    it('should get collection with correct name', async () => {
      let requestedName = null;
      mockDb.collection = (name) => {
        requestedName = name;
        return mockCollection;
      };

      await service.getModel();
      assert.strictEqual(requestedName, 'participants');
    });
  });

  describe('participant structure', () => {
    it('should handle participants with required fields', async () => {
      const participant = {
        _id: 'participant1',
        code: 'P001',
        identifier: 'ID001',
        campaign: 'campaign1',
        study: 'study1',
        interviewDesign: 'itwd1',
        activated: true,
        data: {},
        reminders: [],
        createdBy: 'user1',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCollection.findOne = async () => participant;

      const result = await service._get('participant1', {});
      
      assert.strictEqual(result.code, 'P001');
      assert.strictEqual(result.identifier, 'ID001');
      assert.strictEqual(result.campaign, 'campaign1');
      assert.strictEqual(result.activated, true);
      assert.ok(Array.isArray(result.reminders));
      assert.ok(typeof result.data === 'object');
    });

    it('should handle participants with optional fields', async () => {
      const participant = {
        _id: 'participant1',
        code: 'P002',
        identifier: 'ID002',
        password: 'hashedPassword',
        campaign: 'campaign1',
        study: 'study1',
        interviewDesign: 'itwd1',
        activated: true,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
        initialContact: new Date('2024-01-15'),
        lastSeen: new Date('2024-06-01'),
        initAt: new Date('2024-01-20'),
        data: { age: 30, gender: 'male' },
        reminders: []
      };

      mockCollection.findOne = async () => participant;

      const result = await service._get('participant1', {});
      
      assert.ok(result.password);
      assert.ok(result.validFrom);
      assert.ok(result.validUntil);
      assert.ok(result.initialContact);
      assert.ok(result.lastSeen);
      assert.ok(result.initAt);
      assert.strictEqual(result.data.age, 30);
    });

    it('should handle participants with reminders', async () => {
      const participant = {
        _id: 'participant1',
        code: 'P003',
        identifier: 'ID003',
        campaign: 'campaign1',
        activated: true,
        data: {},
        reminders: [
          {
            type: 'activation',
            date: new Date('2024-01-10')
          },
          {
            type: 'reminder',
            date: new Date('2024-02-10')
          },
          {
            type: 'expiration',
            date: new Date('2024-12-20')
          }
        ]
      };

      mockCollection.findOne = async () => participant;

      const result = await service._get('participant1', {});
      
      assert.strictEqual(result.reminders.length, 3);
      assert.strictEqual(result.reminders[0].type, 'activation');
      assert.strictEqual(result.reminders[1].type, 'reminder');
      assert.strictEqual(result.reminders[2].type, 'expiration');
      assert.ok(result.reminders[0].date);
    });

    it('should handle participants with empty reminders array', async () => {
      const participant = {
        _id: 'participant1',
        code: 'P004',
        identifier: 'ID004',
        campaign: 'campaign1',
        activated: true,
        data: {},
        reminders: []
      };

      mockCollection.findOne = async () => participant;

      const result = await service._get('participant1', {});
      
      assert.ok(Array.isArray(result.reminders));
      assert.strictEqual(result.reminders.length, 0);
    });

    it('should handle participants with valid date ranges', async () => {
      const validFrom = new Date('2024-01-01');
      const validUntil = new Date('2024-12-31');
      const participant = {
        _id: 'participant1',
        code: 'P005',
        identifier: 'ID005',
        campaign: 'campaign1',
        activated: true,
        validFrom: validFrom,
        validUntil: validUntil,
        data: {},
        reminders: []
      };

      mockCollection.findOne = async () => participant;

      const result = await service._get('participant1', {});
      
      assert.ok(result.validFrom);
      assert.ok(result.validUntil);
      assert.strictEqual(result.validFrom.getTime(), validFrom.getTime());
      assert.strictEqual(result.validUntil.getTime(), validUntil.getTime());
    });

    it('should handle participants with null date fields', async () => {
      const participant = {
        _id: 'participant1',
        code: 'P006',
        identifier: '',
        campaign: 'campaign1',
        activated: true,
        validFrom: null,
        validUntil: null,
        initialContact: null,
        lastSeen: null,
        initAt: null,
        data: {},
        reminders: []
      };

      mockCollection.findOne = async () => participant;

      const result = await service._get('participant1', {});
      
      assert.strictEqual(result.validFrom, null);
      assert.strictEqual(result.validUntil, null);
      assert.strictEqual(result.initialContact, null);
    });

    it('should handle participants with nested data', async () => {
      const participant = {
        _id: 'participant1',
        code: 'P007',
        identifier: 'ID007',
        campaign: 'campaign1',
        activated: true,
        data: {
          demographics: {
            age: 35,
            gender: 'female',
            location: {
              city: 'Boston',
              state: 'MA',
              zip: '02101'
            }
          },
          contact: {
            email: 'participant@example.com',
            phone: '555-0100'
          }
        },
        reminders: []
      };

      mockCollection.findOne = async () => participant;

      const result = await service._get('participant1', {});
      
      assert.ok(result.data.demographics);
      assert.strictEqual(result.data.demographics.age, 35);
      assert.ok(result.data.demographics.location);
      assert.strictEqual(result.data.demographics.location.city, 'Boston');
      assert.ok(result.data.contact);
      assert.strictEqual(result.data.contact.email, 'participant@example.com');
    });
  });

  describe('activation states', () => {
    it('should handle activated participants', async () => {
      const participant = {
        _id: 'participant1',
        code: 'P008',
        campaign: 'campaign1',
        activated: true,
        data: {},
        reminders: []
      };

      mockCollection.findOne = async () => participant;

      const result = await service._get('participant1', {});
      
      assert.strictEqual(result.activated, true);
    });

    it('should handle deactivated participants', async () => {
      const participant = {
        _id: 'participant1',
        code: 'P009',
        campaign: 'campaign1',
        activated: false,
        data: {},
        reminders: []
      };

      mockCollection.findOne = async () => participant;

      const result = await service._get('participant1', {});
      
      assert.strictEqual(result.activated, false);
    });

    it('should handle participants with activation tracking', async () => {
      const participant = {
        _id: 'participant1',
        code: 'P010',
        campaign: 'campaign1',
        activated: true,
        initAt: new Date('2024-01-20'),
        lastSeen: new Date('2024-06-15'),
        data: {},
        reminders: []
      };

      mockCollection.findOne = async () => participant;

      const result = await service._get('participant1', {});
      
      assert.strictEqual(result.activated, true);
      assert.ok(result.initAt);
      assert.ok(result.lastSeen);
    });
  });

  describe('query operations', () => {
    it('should support filtering by campaign', async () => {
      const participants = [
        {
          _id: 'p1',
          code: 'P001',
          campaign: 'campaign1',
          activated: true,
          data: {},
          reminders: []
        }
      ];

      mockCollection.find = (query) => {
        assert.ok(query.campaign);
        return createCursor(participants)();
      };

      const createCursor = (data) => () => ({
        limit: () => ({ skip: () => ({ toArray: async () => data }) })
      });

      await service._find({ query: { campaign: 'campaign1' } });
    });

    it('should support filtering by activated status', async () => {
      const participants = [
        {
          _id: 'p1',
          code: 'P001',
          campaign: 'campaign1',
          activated: true,
          data: {},
          reminders: []
        }
      ];

      mockCollection.find = (query) => {
        assert.ok(query.activated !== undefined);
        return createCursor(participants)();
      };

      const createCursor = (data) => () => ({
        limit: () => ({ skip: () => ({ toArray: async () => data }) })
      });

      await service._find({ query: { activated: true } });
    });

    it('should support filtering by code', async () => {
      const participants = [
        {
          _id: 'p1',
          code: 'P001',
          campaign: 'campaign1',
          activated: true,
          data: {},
          reminders: []
        }
      ];

      mockCollection.find = (query) => {
        assert.ok(query.code);
        return createCursor(participants)();
      };

      const createCursor = (data) => () => ({
        limit: () => ({ skip: () => ({ toArray: async () => data }) })
      });

      await service._find({ query: { code: 'P001' } });
    });

    it('should support $or queries', async () => {
      const participants = [
        {
          _id: 'p1',
          code: 'P001',
          campaign: 'campaign1',
          activated: true,
          data: {},
          reminders: []
        }
      ];

      mockCollection.find = (query) => {
        assert.ok(query.$or);
        return createCursor(participants)();
      };

      const createCursor = (data) => () => ({
        limit: () => ({ skip: () => ({ toArray: async () => data }) })
      });

      await service._find({ 
        query: { 
          $or: [
            { code: 'P001' },
            { code: 'P002' }
          ]
        } 
      });
    });

    it('should support $exists queries', async () => {
      const participants = [
        {
          _id: 'p1',
          code: 'P001',
          campaign: 'campaign1',
          activated: true,
          validFrom: new Date(),
          data: {},
          reminders: []
        }
      ];

      mockCollection.find = (query) => {
        assert.ok(query.validFrom);
        return createCursor(participants)();
      };

      const createCursor = (data) => () => ({
        limit: () => ({ skip: () => ({ toArray: async () => data }) })
      });

      await service._find({ 
        query: { 
          validFrom: { $exists: true }
        } 
      });
    });
  });

  describe('multi-record operations', () => {
    it('should support multi-record create option', () => {
      assert.ok(service.options.multi);
      assert.ok(service.options.multi.includes('create'));
    });

    it('should support multi-record patch option', () => {
      assert.ok(service.options.multi);
      assert.ok(service.options.multi.includes('patch'));
    });

    it('should support multi-record remove option', () => {
      assert.ok(service.options.multi);
      assert.ok(service.options.multi.includes('remove'));
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
        _id: 'participant1', 
        code: 'P001',
        campaign: 'campaign1',
        activated: true,
        data: {},
        reminders: []
      });
      await service._get('participant1', {});
      assert.ok(service.Model);
    });

    it('should load model before _create', async () => {
      const newParticipant = {
        code: 'P-NEW',
        campaign: 'campaign1',
        activated: true,
        data: {},
        reminders: []
      };

      mockCollection.insertOne = async () => ({ 
        insertedId: 'participant123', 
        acknowledged: true 
      });
      mockCollection.findOne = async () => ({ 
        _id: 'participant123', 
        ...newParticipant 
      });

      await service._create(newParticipant, {});
      assert.ok(service.Model);
    });

    it('should load model before _patch', async () => {
      mockCollection.findOneAndUpdate = async () => ({
        value: { 
          _id: 'participant1', 
          code: 'P001', 
          activated: false,
          campaign: 'campaign1',
          data: {},
          reminders: []
        }
      });

      await service._patch('participant1', { activated: false }, {});
      assert.ok(service.Model);
    });

    it('should load model before _remove', async () => {
      mockCollection.findOneAndDelete = async () => ({
        value: { 
          _id: 'participant1', 
          code: 'P001',
          campaign: 'campaign1',
          activated: true,
          data: {},
          reminders: []
        }
      });

      await service._remove('participant1', {});
      assert.ok(service.Model);
    });
  });

  describe('pagination', () => {
    it('should support pagination with limit and skip', async () => {
      const participants = Array.from({ length: 5 }, (_, i) => ({
        _id: `p${i + 1}`,
        code: `P00${i + 1}`,
        campaign: 'campaign1',
        activated: true,
        data: {},
        reminders: []
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
        toArray: async () => participants
      };

      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 100;

      await service._find({ query: { $limit: 10, $skip: 20 } });
      
      assert.strictEqual(limitValue, 10);
      assert.strictEqual(skipValue, 20);
    });
  });

  describe('password handling', () => {
    it('should handle participants with passwords', async () => {
      const participant = {
        _id: 'participant1',
        code: 'P011',
        password: 'hashedPassword123',
        campaign: 'campaign1',
        activated: true,
        data: {},
        reminders: []
      };

      mockCollection.findOne = async () => participant;

      const result = await service._get('participant1', {});
      
      assert.ok(result.password);
    });

    it('should handle participants with null password', async () => {
      const participant = {
        _id: 'participant1',
        code: 'P012',
        password: null,
        campaign: 'campaign1',
        activated: true,
        data: {},
        reminders: []
      };

      mockCollection.findOne = async () => participant;

      const result = await service._get('participant1', {});
      
      assert.strictEqual(result.password, null);
    });

    it('should handle participants with empty password', async () => {
      const participant = {
        _id: 'participant1',
        code: 'P013',
        password: '',
        campaign: 'campaign1',
        activated: true,
        data: {},
        reminders: []
      };

      mockCollection.findOne = async () => participant;

      const result = await service._get('participant1', {});
      
      assert.strictEqual(result.password, '');
    });
  });

  describe('reminder types', () => {
    it('should handle activation reminders', async () => {
      const participant = {
        _id: 'participant1',
        code: 'P014',
        campaign: 'campaign1',
        activated: false,
        data: {},
        reminders: [
          {
            type: 'activation',
            date: new Date('2024-01-10')
          }
        ]
      };

      mockCollection.findOne = async () => participant;

      const result = await service._get('participant1', {});
      
      assert.strictEqual(result.reminders[0].type, 'activation');
    });

    it('should handle multiple reminder types', async () => {
      const participant = {
        _id: 'participant1',
        code: 'P015',
        campaign: 'campaign1',
        activated: true,
        data: {},
        reminders: [
          { type: 'activation', date: new Date('2024-01-10') },
          { type: 'reminder', date: new Date('2024-02-10') },
          { type: 'reminder', date: new Date('2024-03-10') },
          { type: 'expiration', date: new Date('2024-12-20') }
        ]
      };

      mockCollection.findOne = async () => participant;

      const result = await service._get('participant1', {});
      
      assert.strictEqual(result.reminders.length, 4);
      const reminderTypes = result.reminders.map(r => r.type);
      assert.ok(reminderTypes.includes('activation'));
      assert.ok(reminderTypes.includes('reminder'));
      assert.ok(reminderTypes.includes('expiration'));
    });
  });

  describe('integration with real app', () => {
    it('should work with real app instance', () => {
      const realService = app.service('participant');
      assert.ok(realService);
      assert.ok(realService.find);
      assert.ok(realService.get);
      assert.ok(realService.create);
      assert.ok(realService.patch);
      assert.ok(realService.remove);
    });
  });
});
