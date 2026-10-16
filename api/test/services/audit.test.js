const assert = require('assert');
const appPromise = require('../../src/app');
let app;
const { Audit } = require('../../src/services/audit/audit.class');
const { LazyMongoDBService } = require('../../src/services/mongodb-service.class');

before(async function() { this.timeout(30000); app = await appPromise; });

describe('\'audit\' service', () => {
  let service;
  let mockApp;
  let mockCollection;
  let mockDb;

  beforeEach(() => {
    // Create mock MongoDB collection
    mockCollection = {
      find: () => ({
        toArray: async () => [],
        limit: () => ({
          toArray: async () => [],
          skip: () => ({
            toArray: async () => []
          })
        }),
        skip: () => ({
          toArray: async () => [],
          limit: () => ({
            toArray: async () => []
          })
        })
      }),
      findOne: async () => null,
      findOneAndUpdate: async () => ({
        value: {
          _id: 'audit1',
          action: 'update',
          resource: 'user'
        }
      }),
      findOneAndDelete: async () => ({
        value: {
          _id: 'audit1',
          action: 'delete',
          resource: 'user'
        }
      }),
      insertOne: async () => ({ 
        insertedId: 'audit123',
        acknowledged: true 
      }),
      updateOne: async () => ({ 
        matchedCount: 1, 
        modifiedCount: 1 
      }),
      deleteOne: async () => ({ 
        deletedCount: 1 
      }),
      countDocuments: async () => 0
    };

    // Create mock database
    mockDb = {
      collection: (name) => {
        if (name === 'audits') {
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

    service = new Audit({ paginate: { max: 1000 } }, mockApp);
  });

  describe('service registration', () => {
    it('registered the service', () => {
      const registeredService = app.service('audit');
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

    it('should set collection name to audits', () => {
      assert.strictEqual(service.collectionName, 'audits');
    });

    it('should not have Model initialized yet', () => {
      assert.ok(!service.Model);
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

    it('should get collection with correct name', async () => {
      let requestedName = null;
      mockDb.collection = (name) => {
        requestedName = name;
        return mockCollection;
      };

      await service.getModel();
      assert.strictEqual(requestedName, 'audits');
    });
  });

  describe('lazy loading behavior', () => {
    it('should load model before _find', async () => {
      mockCollection.find = () => ({
        toArray: async () => [
          { _id: 'audit1', action: 'create', resource: 'user' }
        ],
        limit: () => ({
          toArray: async () => [
            { _id: 'audit1', action: 'create', resource: 'user' }
          ]
        }),
        skip: () => ({
          limit: () => ({
            toArray: async () => [
              { _id: 'audit1', action: 'create', resource: 'user' }
            ]
          })
        })
      });

      mockCollection.countDocuments = async () => 1;

      const result = await service._find({ query: {} });
      
      assert.ok(service.Model);
      assert.ok(result);
    });

    it('should load model before _get', async () => {
      mockCollection.findOne = async () => ({
        _id: 'audit1',
        action: 'create',
        resource: 'user',
        userId: 'user123'
      });

      const result = await service._get('audit1', {});
      
      assert.ok(service.Model);
      assert.ok(result);
      assert.strictEqual(result._id, 'audit1');
    });

    it('should load model before _create', async () => {
      const data = {
        action: 'create',
        resource: 'user',
        resourceId: 'user123'
      };

      mockCollection.insertOne = async () => ({
        insertedId: 'audit123',
        acknowledged: true
      });

      await service._create(data, {});
      
      assert.ok(service.Model);
    });

    it('should load model before _patch', async () => {
      mockCollection.findOneAndUpdate = async () => ({
        value: {
          _id: 'audit1',
          action: 'create',
          resource: 'user',
          notes: 'Updated'
        }
      });

      const result = await service._patch('audit1', { notes: 'Updated' }, {});
      
      assert.ok(service.Model);
      assert.ok(result);
    });

    it('should load model before _remove', async () => {
      mockCollection.findOneAndDelete = async () => ({
        value: {
          _id: 'audit1',
          action: 'create',
          resource: 'user'
        }
      });

      const result = await service._remove('audit1', {});
      
      assert.ok(service.Model);
      assert.ok(result);
    });
  });

  describe('audit record structure', () => {
    it('should handle audit records with required fields', async () => {
      const auditRecord = {
        _id: 'audit1',
        action: 'create',
        resource: 'user',
        resourceId: 'user123',
        userId: 'admin1',
        timestamp: new Date()
      };

      mockCollection.findOne = async () => auditRecord;

      const result = await service._get('audit1', {});
      
      assert.strictEqual(result.action, 'create');
      assert.strictEqual(result.resource, 'user');
      assert.strictEqual(result.resourceId, 'user123');
      assert.strictEqual(result.userId, 'admin1');
      assert.ok(result.timestamp);
    });

    it('should handle audit records with optional fields', async () => {
      const auditRecord = {
        _id: 'audit1',
        action: 'update',
        resource: 'participant',
        resourceId: 'p123',
        userId: 'interviewer1',
        timestamp: new Date(),
        changes: {
          before: { status: 'active' },
          after: { status: 'inactive' }
        },
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        },
        notes: 'Deactivated due to completion'
      };

      mockCollection.findOne = async () => auditRecord;

      const result = await service._get('audit1', {});
      
      assert.ok(result.changes);
      assert.ok(result.metadata);
      assert.strictEqual(result.notes, 'Deactivated due to completion');
    });
  });

  describe('query operations', () => {
    it('should accept filtering by action', async () => {
      const cursor = {
        limit: () => cursor,
        skip: () => cursor,
        toArray: async () => [
          { _id: 'audit1', action: 'create', resource: 'user' }
        ]
      };

      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 1;

      // Should not throw error
      await service._find({ query: { action: 'create' } });
      assert.ok(service.Model);
    });

    it('should accept filtering by resource', async () => {
      const cursor = {
        limit: () => cursor,
        skip: () => cursor,
        toArray: async () => []
      };

      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 0;

      // Should not throw error
      await service._find({ query: { resource: 'user' } });
      assert.ok(service.Model);
    });

    it('should accept filtering by userId', async () => {
      const cursor = {
        limit: () => cursor,
        skip: () => cursor,
        toArray: async () => []
      };

      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 0;

      // Should not throw error
      await service._find({ query: { userId: 'user123' } });
      assert.ok(service.Model);
    });

    it('should accept date range queries', async () => {
      const cursor = {
        limit: () => cursor,
        skip: () => cursor,
        toArray: async () => []
      };

      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 0;

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      // Should not throw error
      await service._find({ 
        query: { 
          timestamp: { 
            $gte: startDate, 
            $lte: endDate 
          } 
        } 
      });
      
      assert.ok(service.Model);
    });

    it('should accept combined filters', async () => {
      const cursor = {
        limit: () => cursor,
        skip: () => cursor,
        toArray: async () => []
      };

      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 0;

      // Should not throw error
      await service._find({ 
        query: { 
          action: 'delete',
          resource: 'participant',
          userId: 'admin1'
        } 
      });
      
      assert.ok(service.Model);
    });
  });

  describe('pagination', () => {
    it('should accept pagination with limit and skip', async () => {
      const auditRecords = [
        { _id: 'audit1', action: 'create', resource: 'user' },
        { _id: 'audit2', action: 'update', resource: 'user' }
      ];

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
        toArray: async () => auditRecords
      };

      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 50;

      // Should not throw error
      await service._find({ 
        query: { $skip: 10, $limit: 5 } 
      });

      assert.strictEqual(limitValue, 5);
      assert.strictEqual(skipValue, 10);
      assert.ok(service.Model);
    });
  });

  describe('audit actions', () => {
    it('should handle create action audits', async () => {
      const auditRecord = {
        _id: 'audit1',
        action: 'create',
        resource: 'user',
        resourceId: 'user123',
        userId: 'admin1',
        timestamp: new Date(),
        changes: {
          after: { email: 'test@example.com', role: 'interviewer' }
        }
      };

      mockCollection.findOne = async () => auditRecord;

      const result = await service._get('audit1', {});
      
      assert.strictEqual(result.action, 'create');
      assert.ok(result.changes.after);
    });

    it('should handle update action audits', async () => {
      const auditRecord = {
        _id: 'audit1',
        action: 'update',
        resource: 'participant',
        resourceId: 'p123',
        userId: 'interviewer1',
        timestamp: new Date(),
        changes: {
          before: { status: 'active', notes: 'Old notes' },
          after: { status: 'active', notes: 'Updated notes' }
        }
      };

      mockCollection.findOne = async () => auditRecord;

      const result = await service._get('audit1', {});
      
      assert.strictEqual(result.action, 'update');
      assert.ok(result.changes.before);
      assert.ok(result.changes.after);
    });

    it('should handle delete action audits', async () => {
      const auditRecord = {
        _id: 'audit1',
        action: 'delete',
        resource: 'case-report',
        resourceId: 'cr123',
        userId: 'manager1',
        timestamp: new Date(),
        changes: {
          before: { data: { field1: 'value1' } }
        },
        notes: 'Deleted upon request'
      };

      mockCollection.findOne = async () => auditRecord;

      const result = await service._get('audit1', {});
      
      assert.strictEqual(result.action, 'delete');
      assert.ok(result.changes.before);
      assert.strictEqual(result.notes, 'Deleted upon request');
    });

    it('should handle login action audits', async () => {
      const auditRecord = {
        _id: 'audit1',
        action: 'login',
        resource: 'authentication',
        userId: 'user123',
        timestamp: new Date(),
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          success: true
        }
      };

      mockCollection.findOne = async () => auditRecord;

      const result = await service._get('audit1', {});
      
      assert.strictEqual(result.action, 'login');
      assert.ok(result.metadata.success);
    });

    it('should handle export action audits', async () => {
      const auditRecord = {
        _id: 'audit1',
        action: 'export',
        resource: 'case-report',
        userId: 'researcher1',
        timestamp: new Date(),
        metadata: {
          format: 'csv',
          recordCount: 150,
          filters: { study: 'study123' }
        }
      };

      mockCollection.findOne = async () => auditRecord;

      const result = await service._get('audit1', {});
      
      assert.strictEqual(result.action, 'export');
      assert.strictEqual(result.metadata.format, 'csv');
      assert.strictEqual(result.metadata.recordCount, 150);
    });
  });

  describe('resource types', () => {
    const resourceTypes = [
      'user', 
      'group', 
      'study', 
      'form', 
      'case-report-form', 
      'case-report',
      'interview-design', 
      'interview', 
      'participant', 
      'campaign'
    ];

    resourceTypes.forEach(resourceType => {
      it(`should handle ${resourceType} resource audits`, async () => {
        const auditRecord = {
          _id: 'audit1',
          action: 'create',
          resource: resourceType,
          resourceId: 'resource123',
          userId: 'user1',
          timestamp: new Date()
        };

        mockCollection.findOne = async () => auditRecord;

        const result = await service._get('audit1', {});
        
        assert.strictEqual(result.resource, resourceType);
      });
    });
  });

  describe('error handling', () => {
    it('should handle not found records', async () => {
      mockCollection.findOne = async () => null;

      try {
        await service._get('nonexistent', {});
        assert.fail('Should have thrown error');
      } catch (err) {
        assert.ok(err);
      }
    });

    it('should handle database errors gracefully', async () => {
      mockDb.collection = () => {
        throw new Error('Database connection error');
      };

      const newService = new Audit({ paginate: { max: 1000 } }, mockApp);

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
      const realService = app.service('audit');
      assert.ok(realService);
    });
  });
});
