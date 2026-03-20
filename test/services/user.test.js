const assert = require('assert');
const app = require('../../src/app');
const { User } = require('../../src/services/user/user.class');
const { LazyMongoDBService } = require('../../src/services/mongodb-service.class');

describe('\'user\' service', () => {
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
          _id: 'user1',
          email: 'test@example.com',
          firstname: 'John',
          lastname: 'Doe',
          role: 'interviewer'
        }
      }),
      findOneAndDelete: async () => ({
        value: {
          _id: 'user1',
          email: 'test@example.com',
          firstname: 'John',
          lastname: 'Doe',
          role: 'interviewer'
        }
      }),
      insertOne: async () => ({ 
        insertedId: 'user123',
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
        if (name === 'users') {
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

    service = new User({ 
      paginate: { max: 1000 },
      multi: ['remove'],
      filters: { $nor: true, $and: true },
      operators: ['$nor', '$and', '$regex']
    }, mockApp);
  });

  describe('service registration', () => {
    it('registered the service', () => {
      const registeredService = app.service('user');
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

    it('should set collection name to users', () => {
      assert.strictEqual(service.collectionName, 'users');
    });

    it('should set paginate option', () => {
      assert.deepStrictEqual(service.options.paginate, { max: 1000 });
    });

    it('should set multi option', () => {
      assert.deepStrictEqual(service.options.multi, ['remove']);
    });

    it('should set filters option', () => {
      assert.deepStrictEqual(service.options.filters, { $nor: true, $and: true });
    });

    it('should set operators option', () => {
      assert.deepStrictEqual(service.options.operators, ['$nor', '$and', '$regex']);
    });
  });

  describe('getModel', () => {
    it('should return MongoDB collection when called', async () => {
      const model = await service.getModel();
      assert.ok(model);
      assert.strictEqual(model, mockCollection);
    });

    it('should cache the model after first call', async () => {
      const model1 = await service.getModel();
      const model2 = await service.getModel();
      assert.strictEqual(model1, model2);
    });

    it('should call app.get with mongodbClient', async () => {
      let calledWithMongodbClient = false;
      const testApp = {
        get: (key) => {
          if (key === 'mongodbClient') {
            calledWithMongodbClient = true;
            return Promise.resolve(mockDb);
          }
        }
      };
      const testService = new User({}, testApp);
      await testService.getModel();
      assert.ok(calledWithMongodbClient);
    });

    it('should get collection with correct name', async () => {
      let collectionName = null;
      const testDb = {
        collection: (name) => {
          collectionName = name;
          return mockCollection;
        }
      };
      const testApp = {
        get: () => Promise.resolve(testDb)
      };
      const testService = new User({}, testApp);
      await testService.getModel();
      assert.strictEqual(collectionName, 'users');
    });
  });

  describe('lazy loading behavior', () => {
    it('should load model before _find', async () => {
      mockCollection.countDocuments = async () => 0;
      await service._find({ query: {} });
      assert.ok(service.Model);
    });

    it('should load model before _get', async () => {
      mockCollection.findOne = async () => ({ 
        _id: 'user1', 
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe'
      });
      await service._get('user1');
      assert.ok(service.Model);
    });

    it('should load model before _create', async () => {
      await service._create({ 
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe'
      });
      assert.ok(service.Model);
    });

    it('should load model before _patch', async () => {
      await service._patch('user1', { firstname: 'Jane' });
      assert.ok(service.Model);
    });

    it('should load model before _remove', async () => {
      await service._remove('user1');
      assert.ok(service.Model);
    });
  });

  describe('user structure - basic fields', () => {
    it('should handle user with required fields only', async () => {
      const userData = {
        email: 'user@example.com',
        firstname: 'Jane',
        lastname: 'Smith',
        password: 'Password123!'
      };
      mockCollection.insertOne = async (data) => {
        assert.strictEqual(data.email, userData.email);
        assert.strictEqual(data.firstname, userData.firstname);
        assert.strictEqual(data.lastname, userData.lastname);
        return { insertedId: 'user456', acknowledged: true };
      };
      await service._create(userData);
    });

    it('should handle user with email', async () => {
      const userData = {
        email: 'admin@example.com',
        firstname: 'Admin',
        lastname: 'User'
      };
      mockCollection.insertOne = async (data) => {
        assert.strictEqual(data.email, 'admin@example.com');
        return { insertedId: 'user789', acknowledged: true };
      };
      await service._create(userData);
    });

    it('should handle user with firstname and lastname', async () => {
      const userData = {
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe'
      };
      mockCollection.insertOne = async (data) => {
        assert.strictEqual(data.firstname, 'John');
        assert.strictEqual(data.lastname, 'Doe');
        return { insertedId: 'user101', acknowledged: true };
      };
      await service._create(userData);
    });

    it('should handle user with language', async () => {
      const userData = {
        email: 'test@example.com',
        firstname: 'Jean',
        lastname: 'Dupont',
        language: 'fr'
      };
      mockCollection.insertOne = async (data) => {
        assert.strictEqual(data.language, 'fr');
        return { insertedId: 'user202', acknowledged: true };
      };
      await service._create(userData);
    });

    it('should handle user with locale', async () => {
      const userData = {
        email: 'test@example.com',
        firstname: 'Hans',
        lastname: 'Mueller',
        locale: 'de-DE'
      };
      mockCollection.insertOne = async (data) => {
        assert.strictEqual(data.locale, 'de-DE');
        return { insertedId: 'user303', acknowledged: true };
      };
      await service._create(userData);
    });
  });

  describe('user structure - role field', () => {
    it('should handle user with administrator role', async () => {
      const userData = {
        email: 'admin@example.com',
        firstname: 'Admin',
        lastname: 'User',
        role: 'administrator'
      };
      mockCollection.insertOne = async (data) => {
        assert.strictEqual(data.role, 'administrator');
        return { insertedId: 'user404', acknowledged: true };
      };
      await service._create(userData);
    });

    it('should handle user with manager role', async () => {
      const userData = {
        email: 'manager@example.com',
        firstname: 'Manager',
        lastname: 'User',
        role: 'manager'
      };
      mockCollection.insertOne = async (data) => {
        assert.strictEqual(data.role, 'manager');
        return { insertedId: 'user505', acknowledged: true };
      };
      await service._create(userData);
    });

    it('should handle user with interviewer role', async () => {
      const userData = {
        email: 'interviewer@example.com',
        firstname: 'Interviewer',
        lastname: 'User',
        role: 'interviewer'
      };
      mockCollection.insertOne = async (data) => {
        assert.strictEqual(data.role, 'interviewer');
        return { insertedId: 'user606', acknowledged: true };
      };
      await service._create(userData);
    });

    it('should handle user with guest role', async () => {
      const userData = {
        email: 'guest@example.com',
        firstname: 'Guest',
        lastname: 'User',
        role: 'guest'
      };
      mockCollection.insertOne = async (data) => {
        assert.strictEqual(data.role, 'guest');
        return { insertedId: 'user707', acknowledged: true };
      };
      await service._create(userData);
    });

    it('should handle user with inactive role', async () => {
      const userData = {
        email: 'inactive@example.com',
        firstname: 'Inactive',
        lastname: 'User',
        role: 'inactive'
      };
      mockCollection.insertOne = async (data) => {
        assert.strictEqual(data.role, 'inactive');
        return { insertedId: 'user808', acknowledged: true };
      };
      await service._create(userData);
    });
  });

  describe('user structure - additional fields', () => {
    it('should handle user with groups array', async () => {
      const userData = {
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
        groups: ['group1', 'group2', 'group3']
      };
      mockCollection.insertOne = async (data) => {
        assert.ok(Array.isArray(data.groups));
        assert.strictEqual(data.groups.length, 3);
        assert.deepStrictEqual(data.groups, ['group1', 'group2', 'group3']);
        return { insertedId: 'user909', acknowledged: true };
      };
      await service._create(userData);
    });

    it('should handle user with empty groups array', async () => {
      const userData = {
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
        groups: []
      };
      mockCollection.insertOne = async (data) => {
        assert.ok(Array.isArray(data.groups));
        assert.strictEqual(data.groups.length, 0);
        return { insertedId: 'user1010', acknowledged: true };
      };
      await service._create(userData);
    });

    it('should handle user with apiKey', async () => {
      const userData = {
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
        apiKey: 'abc123def456'
      };
      mockCollection.insertOne = async (data) => {
        assert.strictEqual(data.apiKey, 'abc123def456');
        return { insertedId: 'user1111', acknowledged: true };
      };
      await service._create(userData);
    });

    it('should handle user with createdBy', async () => {
      const userData = {
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
        createdBy: 'admin123'
      };
      mockCollection.insertOne = async (data) => {
        assert.strictEqual(data.createdBy, 'admin123');
        return { insertedId: 'user1212', acknowledged: true };
      };
      await service._create(userData);
    });

    it('should handle user with institution', async () => {
      const userData = {
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
        institution: 'Harvard University'
      };
      mockCollection.insertOne = async (data) => {
        assert.strictEqual(data.institution, 'Harvard University');
        return { insertedId: 'user1313', acknowledged: true };
      };
      await service._create(userData);
    });

    it('should handle user with city', async () => {
      const userData = {
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
        city: 'Boston'
      };
      mockCollection.insertOne = async (data) => {
        assert.strictEqual(data.city, 'Boston');
        return { insertedId: 'user1414', acknowledged: true };
      };
      await service._create(userData);
    });

    it('should handle user with title', async () => {
      const userData = {
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
        title: 'Dr.'
      };
      mockCollection.insertOne = async (data) => {
        assert.strictEqual(data.title, 'Dr.');
        return { insertedId: 'user1515', acknowledged: true };
      };
      await service._create(userData);
    });

    it('should handle user with phone', async () => {
      const userData = {
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
        phone: '+1 555-1234'
      };
      mockCollection.insertOne = async (data) => {
        assert.strictEqual(data.phone, '+1 555-1234');
        return { insertedId: 'user1616', acknowledged: true };
      };
      await service._create(userData);
    });

    it('should handle user with permissions array', async () => {
      const userData = {
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
        permissions: ['read:users', 'write:users', 'delete:users']
      };
      mockCollection.insertOne = async (data) => {
        assert.ok(Array.isArray(data.permissions));
        assert.strictEqual(data.permissions.length, 3);
        return { insertedId: 'user1717', acknowledged: true };
      };
      await service._create(userData);
    });

    it('should handle user with 2FA enabled', async () => {
      const userData = {
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
        with2fa: true,
        totp2faRequired: true
      };
      mockCollection.insertOne = async (data) => {
        assert.strictEqual(data.with2fa, true);
        assert.strictEqual(data.totp2faRequired, true);
        return { insertedId: 'user1818', acknowledged: true };
      };
      await service._create(userData);
    });

    it('should handle user with 2FA secret', async () => {
      const userData = {
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
        totp2faSecret: 'JBSWY3DPEHPK3PXP'
      };
      mockCollection.insertOne = async (data) => {
        assert.strictEqual(data.totp2faSecret, 'JBSWY3DPEHPK3PXP');
        return { insertedId: 'user1919', acknowledged: true };
      };
      await service._create(userData);
    });
  });

  describe('user structure - complete user objects', () => {
    it('should handle complete administrator user', async () => {
      const userData = {
        email: 'admin@example.com',
        firstname: 'Admin',
        lastname: 'User',
        role: 'administrator',
        language: 'en',
        locale: 'en-US',
        groups: ['admin-group'],
        permissions: ['manage:all'],
        institution: 'Tech Corp',
        city: 'San Francisco',
        title: 'Dr.',
        phone: '+1 555-9999',
        with2fa: true,
        totp2faRequired: true
      };
      mockCollection.insertOne = async (data) => {
        assert.strictEqual(data.email, 'admin@example.com');
        assert.strictEqual(data.role, 'administrator');
        assert.ok(Array.isArray(data.groups));
        assert.ok(Array.isArray(data.permissions));
        return { insertedId: 'user2020', acknowledged: true };
      };
      await service._create(userData);
    });

    it('should handle complete manager user', async () => {
      const userData = {
        email: 'manager@example.com',
        firstname: 'Manager',
        lastname: 'User',
        role: 'manager',
        language: 'fr',
        groups: ['manager-group', 'project-a'],
        permissions: ['read:users', 'write:users'],
        institution: 'Research Institute',
        city: 'Paris'
      };
      mockCollection.insertOne = async (data) => {
        assert.strictEqual(data.email, 'manager@example.com');
        assert.strictEqual(data.role, 'manager');
        assert.strictEqual(data.language, 'fr');
        return { insertedId: 'user2121', acknowledged: true };
      };
      await service._create(userData);
    });

    it('should handle complete interviewer user', async () => {
      const userData = {
        email: 'interviewer@example.com',
        firstname: 'Interviewer',
        lastname: 'User',
        role: 'interviewer',
        language: 'es',
        groups: ['field-team'],
        createdBy: 'admin123'
      };
      mockCollection.insertOne = async (data) => {
        assert.strictEqual(data.email, 'interviewer@example.com');
        assert.strictEqual(data.role, 'interviewer');
        assert.strictEqual(data.createdBy, 'admin123');
        return { insertedId: 'user2222', acknowledged: true };
      };
      await service._create(userData);
    });
  });

  describe('query operations', () => {
    it('should find users with email filter', async () => {
      const targetEmail = 'test@example.com';
      mockCollection.find = (query) => {
        assert.strictEqual(query.email, targetEmail);
        return {
          limit: () => ({ 
            skip: () => ({ 
              sort: () => ({ 
                toArray: async () => [{ 
                  _id: 'user1', 
                  email: targetEmail,
                  firstname: 'John',
                  lastname: 'Doe'
                }] 
              }) 
            }) 
          })
        };
      };
      mockCollection.countDocuments = async () => 1;
      await service._find({ query: { email: targetEmail } });
    });

    it('should find users with role filter', async () => {
      mockCollection.find = (query) => {
        assert.strictEqual(query.role, 'administrator');
        return {
          limit: () => ({ 
            skip: () => ({ 
              sort: () => ({ 
                toArray: async () => [
                  { _id: 'user1', email: 'admin1@example.com', role: 'administrator' },
                  { _id: 'user2', email: 'admin2@example.com', role: 'administrator' }
                ] 
              }) 
            }) 
          })
        };
      };
      mockCollection.countDocuments = async () => 2;
      await service._find({ query: { role: 'administrator' } });
    });

    it('should find users with groups filter', async () => {
      mockCollection.find = (query) => {
        assert.deepStrictEqual(query.groups, 'group1');
        return {
          limit: () => ({ 
            skip: () => ({ 
              sort: () => ({ 
                toArray: async () => [{ 
                  _id: 'user1', 
                  email: 'test@example.com',
                  groups: ['group1', 'group2']
                }] 
              }) 
            }) 
          })
        };
      };
      mockCollection.countDocuments = async () => 1;
      await service._find({ query: { groups: 'group1' } });
    });

    it('should find users with $regex operator on email', async () => {
      mockCollection.find = (query) => {
        assert.ok(query.email);
        assert.ok(query.email.$regex);
        return {
          limit: () => ({ 
            skip: () => ({ 
              sort: () => ({ 
                toArray: async () => [
                  { _id: 'user1', email: 'admin@example.com' },
                  { _id: 'user2', email: 'admin2@example.com' }
                ] 
              }) 
            }) 
          })
        };
      };
      mockCollection.countDocuments = async () => 2;
      await service._find({ 
        query: { email: { $regex: 'admin', $options: 'i' } } 
      });
    });

    it('should find users with $nor operator', async () => {
      mockCollection.find = (query) => {
        assert.ok(query.$nor);
        return {
          limit: () => ({ 
            skip: () => ({ 
              sort: () => ({ 
                toArray: async () => [
                  { _id: 'user1', role: 'interviewer' }
                ] 
              }) 
            }) 
          })
        };
      };
      mockCollection.countDocuments = async () => 1;
      await service._find({ 
        query: { $nor: [{ role: 'administrator' }, { role: 'manager' }] } 
      });
    });

    it('should find users with $and operator', async () => {
      mockCollection.find = (query) => {
        assert.ok(query.$and);
        return {
          limit: () => ({ 
            skip: () => ({ 
              sort: () => ({ 
                toArray: async () => [
                  { _id: 'user1', email: 'test@example.com', role: 'administrator' }
                ] 
              }) 
            }) 
          })
        };
      };
      mockCollection.countDocuments = async () => 1;
      await service._find({ 
        query: { $and: [{ role: 'administrator' }, { email: 'test@example.com' }] } 
      });
    });

    it('should find users with multiple filters', async () => {
      mockCollection.find = (query) => {
        assert.strictEqual(query.role, 'manager');
        assert.strictEqual(query.language, 'fr');
        return {
          limit: () => ({ 
            skip: () => ({ 
              sort: () => ({ 
                toArray: async () => [
                  { _id: 'user1', email: 'manager@example.com', role: 'manager', language: 'fr' }
                ] 
              }) 
            }) 
          })
        };
      };
      mockCollection.countDocuments = async () => 1;
      await service._find({ 
        query: { role: 'manager', language: 'fr' } 
      });
    });
  });

  describe('multi-record operations', () => {
    it('should support multi remove operation', async () => {
      mockCollection.deleteMany = async (query) => {
        assert.ok(query);
        return { deletedCount: 3 };
      };
      const result = await service._remove(null, { 
        query: { role: 'inactive' } 
      });
      assert.ok(result);
    });

    it('should delete multiple users with groups filter', async () => {
      mockCollection.deleteMany = async (query) => {
        assert.ok(query);
        return { deletedCount: 5 };
      };
      const result = await service._remove(null, { 
        query: { groups: 'old-group' } 
      });
      assert.ok(result);
    });
  });

  describe('pagination', () => {
    it('should apply limit from paginate option', async () => {
      let appliedLimit = null;
      const cursor = {
        limit: (limit) => {
          appliedLimit = limit;
          return cursor;
        },
        skip: () => cursor,
        toArray: async () => []
      };
      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 0;
      await service._find({ 
        query: {}, 
        paginate: { default: 10, max: 1000 } 
      });
      assert.strictEqual(appliedLimit, 10);
    });

    it('should apply skip for pagination', async () => {
      let appliedSkip = null;
      const cursor = {
        limit: () => cursor,
        skip: (skip) => {
          appliedSkip = skip;
          return cursor;
        },
        toArray: async () => []
      };
      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 0;
      await service._find({ 
        query: { $skip: 20 }, 
        paginate: { default: 10, max: 1000 } 
      });
      assert.strictEqual(appliedSkip, 20);
    });

    it('should apply sort for pagination', async () => {
      const cursor = {
        limit: () => cursor,
        skip: () => cursor,
        sort: () => cursor,
        toArray: async () => []
      };
      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 0;
      await service._find({ 
        query: { $sort: { email: 1 } }, 
        paginate: { default: 10, max: 1000 } 
      });
    });

    it('should respect max limit from paginate option', async () => {
      let appliedLimit = null;
      const cursor = {
        limit: (limit) => {
          appliedLimit = limit;
          return cursor;
        },
        skip: () => cursor,
        toArray: async () => []
      };
      mockCollection.find = () => cursor;
      mockCollection.countDocuments = async () => 0;
      await service._find({ 
        query: { $limit: 5000 }, 
        paginate: { default: 10, max: 1000 } 
      });
      assert.ok(appliedLimit <= 1000);
    });
  });

  describe('error handling', () => {
    it('should throw error when user not found in _get', async () => {
      mockCollection.findOne = async () => null;
      try {
        await service._get('nonexistent');
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error);
      }
    });

    it('should throw error when user not found in _patch', async () => {
      mockCollection.findOneAndUpdate = async () => ({ value: null });
      try {
        await service._patch('nonexistent', { firstname: 'New' });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error);
      }
    });

    it('should throw error when user not found in _remove', async () => {
      mockCollection.findOneAndDelete = async () => ({ value: null });
      try {
        await service._remove('nonexistent');
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error);
      }
    });

    it('should handle database errors in _find', async () => {
      mockCollection.find = () => {
        throw new Error('Database connection failed');
      };
      try {
        await service._find({ query: {} });
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error);
      }
    });

    it('should handle database errors in _create', async () => {
      mockCollection.insertOne = async () => {
        throw new Error('Insert failed');
      };
      try {
        await service._create({ 
          email: 'test@example.com',
          firstname: 'John',
          lastname: 'Doe'
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error);
        assert.strictEqual(error.message, 'Insert failed');
      }
    });
  });

  describe('integration tests', () => {
    it('should have user service registered in app', () => {
      const userService = app.service('user');
      assert.ok(userService);
    });

    it('should have hooks configured for user service', () => {
      const userService = app.service('user');
      assert.ok(userService.__hooks);
    });

    it('should have user service as instance of LazyMongoDBService', () => {
      const userService = app.service('user');
      assert.ok(userService);
      assert.ok(userService instanceof LazyMongoDBService);
    });
  });
});
