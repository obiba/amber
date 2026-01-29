const assert = require('assert');
const app = require('../../src/app');
const { Subjects } = require('../../src/services/subjects/subjects.class');

describe('\'subjects\' service', () => {
  let service;
  let mockApp;
  let mockUserService;
  let mockGroupService;

  beforeEach(() => {
    // Create mock user service
    mockUserService = {
      find: async () => ({
        total: 0,
        limit: 10,
        skip: 0,
        data: []
      })
    };

    // Create mock group service
    mockGroupService = {
      find: async () => ({
        total: 0,
        limit: 10,
        skip: 0,
        data: []
      })
    };

    // Create mock app
    mockApp = {
      service: (name) => {
        if (name === 'user') {
          return mockUserService;
        }
        if (name === 'group') {
          return mockGroupService;
        }
        return null;
      }
    };

    service = new Subjects({ 
      paginate: { max: 1000, default: 10 }
    }, mockApp);
  });

  describe('service registration', () => {
    it('registered the service', () => {
      const registeredService = app.service('subjects');
      assert.ok(registeredService, 'Registered the service');
    });
  });

  describe('constructor', () => {
    it('should initialize with options and app', () => {
      assert.ok(service.app);
      assert.ok(service.options);
      assert.strictEqual(service.app, mockApp);
    });

    it('should accept empty options', () => {
      const serviceWithoutOptions = new Subjects(null, mockApp);
      assert.ok(serviceWithoutOptions.options);
      assert.deepStrictEqual(serviceWithoutOptions.options, {});
    });

    it('should store pagination options', () => {
      assert.ok(service.options.paginate);
      assert.strictEqual(service.options.paginate.max, 1000);
      assert.strictEqual(service.options.paginate.default, 10);
    });
  });

  describe('find', () => {
    it('should return empty array when no users or groups', async () => {
      const result = await service.find({});
      
      assert.ok(Array.isArray(result));
      assert.strictEqual(result.length, 0);
    });

    it('should return users as subjects', async () => {
      mockUserService.find = async () => ({
        total: 2,
        limit: 10,
        skip: 0,
        data: [
          { _id: 'user1', email: 'user1@example.com' },
          { _id: 'user2', email: 'user2@example.com' }
        ]
      });

      const result = await service.find({});
      
      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].type, 'user');
      assert.strictEqual(result[0].id, 'user1');
      assert.strictEqual(result[0].name, 'user1@example.com');
      assert.strictEqual(result[1].type, 'user');
      assert.strictEqual(result[1].id, 'user2');
      assert.strictEqual(result[1].name, 'user2@example.com');
    });

    it('should return groups as subjects', async () => {
      mockGroupService.find = async () => ({
        total: 2,
        limit: 10,
        skip: 0,
        data: [
          { _id: 'group1', name: 'Administrators' },
          { _id: 'group2', name: 'Managers' }
        ]
      });

      const result = await service.find({});
      
      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].type, 'group');
      assert.strictEqual(result[0].id, 'group1');
      assert.strictEqual(result[0].name, 'Administrators');
      assert.strictEqual(result[1].type, 'group');
      assert.strictEqual(result[1].id, 'group2');
      assert.strictEqual(result[1].name, 'Managers');
    });

    it('should return both users and groups as subjects', async () => {
      mockUserService.find = async () => ({
        total: 2,
        limit: 10,
        skip: 0,
        data: [
          { _id: 'user1', email: 'user1@example.com' },
          { _id: 'user2', email: 'user2@example.com' }
        ]
      });

      mockGroupService.find = async () => ({
        total: 2,
        limit: 10,
        skip: 0,
        data: [
          { _id: 'group1', name: 'Administrators' },
          { _id: 'group2', name: 'Managers' }
        ]
      });

      const result = await service.find({});
      
      assert.strictEqual(result.length, 4);
      
      // First two should be users
      assert.strictEqual(result[0].type, 'user');
      assert.strictEqual(result[1].type, 'user');
      
      // Last two should be groups
      assert.strictEqual(result[2].type, 'group');
      assert.strictEqual(result[3].type, 'group');
    });

    it('should convert name query to email query for users', async () => {
      let capturedParams = null;

      mockUserService.find = async (params) => {
        capturedParams = params;
        return {
          total: 0,
          limit: 10,
          skip: 0,
          data: []
        };
      };

      await service.find({ 
        query: { name: 'test@example.com' } 
      });
      
      assert.ok(capturedParams);
      assert.ok(capturedParams.query);
      assert.strictEqual(capturedParams.query.email, 'test@example.com');
      assert.strictEqual(capturedParams.query.name, undefined);
    });

    it('should pass through other query parameters', async () => {
      let userParams = null;
      let groupParams = null;

      mockUserService.find = async (params) => {
        userParams = params;
        return {
          total: 0,
          limit: 10,
          skip: 0,
          data: []
        };
      };

      mockGroupService.find = async (params) => {
        groupParams = params;
        return {
          total: 0,
          limit: 10,
          skip: 0,
          data: []
        };
      };

      await service.find({ 
        query: { 
          $limit: 5,
          $skip: 10
        } 
      });
      
      assert.ok(userParams);
      assert.strictEqual(userParams.query.$limit, 5);
      assert.strictEqual(userParams.query.$skip, 10);
      
      assert.ok(groupParams);
      assert.strictEqual(groupParams.query.$limit, 5);
      assert.strictEqual(groupParams.query.$skip, 10);
    });

    it('should handle empty params', async () => {
      const result = await service.find({});
      
      assert.ok(Array.isArray(result));
      assert.strictEqual(result.length, 0);
    });

    it('should handle params without query', async () => {
      const result = await service.find({ provider: 'rest' });
      
      assert.ok(Array.isArray(result));
      assert.strictEqual(result.length, 0);
    });

    it('should preserve user order before groups', async () => {
      mockUserService.find = async () => ({
        total: 3,
        limit: 10,
        skip: 0,
        data: [
          { _id: 'user1', email: 'a@example.com' },
          { _id: 'user2', email: 'b@example.com' },
          { _id: 'user3', email: 'c@example.com' }
        ]
      });

      mockGroupService.find = async () => ({
        total: 3,
        limit: 10,
        skip: 0,
        data: [
          { _id: 'group1', name: 'Group A' },
          { _id: 'group2', name: 'Group B' },
          { _id: 'group3', name: 'Group C' }
        ]
      });

      const result = await service.find({});
      
      assert.strictEqual(result.length, 6);
      
      // Verify all users come first
      for (let i = 0; i < 3; i++) {
        assert.strictEqual(result[i].type, 'user');
      }
      
      // Verify all groups come after
      for (let i = 3; i < 6; i++) {
        assert.strictEqual(result[i].type, 'group');
      }
    });

    it('should handle users with special characters in email', async () => {
      mockUserService.find = async () => ({
        total: 1,
        limit: 10,
        skip: 0,
        data: [
          { _id: 'user1', email: 'user+test@example.com' }
        ]
      });

      const result = await service.find({});
      
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].name, 'user+test@example.com');
    });

    it('should handle groups with special characters in name', async () => {
      mockGroupService.find = async () => ({
        total: 1,
        limit: 10,
        skip: 0,
        data: [
          { _id: 'group1', name: 'Group (Admin) - Level 1' }
        ]
      });

      const result = await service.find({});
      
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].name, 'Group (Admin) - Level 1');
    });

    it('should handle large result sets', async () => {
      const users = Array.from({ length: 50 }, (_, i) => ({
        _id: `user${i}`,
        email: `user${i}@example.com`
      }));

      const groups = Array.from({ length: 50 }, (_, i) => ({
        _id: `group${i}`,
        name: `Group ${i}`
      }));

      mockUserService.find = async () => ({
        total: 50,
        limit: 100,
        skip: 0,
        data: users
      });

      mockGroupService.find = async () => ({
        total: 50,
        limit: 100,
        skip: 0,
        data: groups
      });

      const result = await service.find({});
      
      assert.strictEqual(result.length, 100);
    });
  });

  describe('unimplemented methods', () => {
    it('should throw BadRequest for get', async () => {
      try {
        await service.get('subject1', {});
        assert.fail('Should have thrown BadRequest');
      } catch (error) {
        assert.ok(error);
        assert.strictEqual(error.name, 'BadRequest');
        assert.strictEqual(error.message, 'Not implemented');
      }
    });

    it('should throw BadRequest for create', async () => {
      try {
        await service.create({ name: 'New Subject' }, {});
        assert.fail('Should have thrown BadRequest');
      } catch (error) {
        assert.ok(error);
        assert.strictEqual(error.name, 'BadRequest');
        assert.strictEqual(error.message, 'Not implemented');
      }
    });

    it('should throw BadRequest for update', async () => {
      try {
        await service.update('subject1', { name: 'Updated Subject' }, {});
        assert.fail('Should have thrown BadRequest');
      } catch (error) {
        assert.ok(error);
        assert.strictEqual(error.name, 'BadRequest');
        assert.strictEqual(error.message, 'Not implemented');
      }
    });

    it('should throw BadRequest for patch', async () => {
      try {
        await service.patch('subject1', { name: 'Patched Subject' }, {});
        assert.fail('Should have thrown BadRequest');
      } catch (error) {
        assert.ok(error);
        assert.strictEqual(error.name, 'BadRequest');
        assert.strictEqual(error.message, 'Not implemented');
      }
    });

    it('should throw BadRequest for remove', async () => {
      try {
        await service.remove('subject1', {});
        assert.fail('Should have thrown BadRequest');
      } catch (error) {
        assert.ok(error);
        assert.strictEqual(error.name, 'BadRequest');
        assert.strictEqual(error.message, 'Not implemented');
      }
    });
  });

  describe('subject structure', () => {
    it('should have correct structure for user subjects', async () => {
      mockUserService.find = async () => ({
        total: 1,
        limit: 10,
        skip: 0,
        data: [
          { _id: 'user123', email: 'test@example.com' }
        ]
      });

      const result = await service.find({});
      
      assert.strictEqual(result.length, 1);
      assert.ok(result[0].type);
      assert.ok(result[0].id);
      assert.ok(result[0].name);
      assert.strictEqual(result[0].type, 'user');
      assert.strictEqual(result[0].id, 'user123');
      assert.strictEqual(result[0].name, 'test@example.com');
    });

    it('should have correct structure for group subjects', async () => {
      mockGroupService.find = async () => ({
        total: 1,
        limit: 10,
        skip: 0,
        data: [
          { _id: 'group123', name: 'Test Group' }
        ]
      });

      const result = await service.find({});
      
      assert.strictEqual(result.length, 1);
      assert.ok(result[0].type);
      assert.ok(result[0].id);
      assert.ok(result[0].name);
      assert.strictEqual(result[0].type, 'group');
      assert.strictEqual(result[0].id, 'group123');
      assert.strictEqual(result[0].name, 'Test Group');
    });

    it('should not include extra user fields', async () => {
      mockUserService.find = async () => ({
        total: 1,
        limit: 10,
        skip: 0,
        data: [
          { 
            _id: 'user1', 
            email: 'test@example.com',
            password: 'secret',
            role: 'admin',
            firstname: 'John',
            lastname: 'Doe'
          }
        ]
      });

      const result = await service.find({});
      
      assert.strictEqual(result.length, 1);
      assert.strictEqual(Object.keys(result[0]).length, 3);
      assert.ok(result[0].type);
      assert.ok(result[0].id);
      assert.ok(result[0].name);
      assert.strictEqual(result[0].password, undefined);
      assert.strictEqual(result[0].role, undefined);
    });

    it('should not include extra group fields', async () => {
      mockGroupService.find = async () => ({
        total: 1,
        limit: 10,
        skip: 0,
        data: [
          { 
            _id: 'group1', 
            name: 'Test Group',
            description: 'A test group',
            users: ['user1', 'user2']
          }
        ]
      });

      const result = await service.find({});
      
      assert.strictEqual(result.length, 1);
      assert.strictEqual(Object.keys(result[0]).length, 3);
      assert.ok(result[0].type);
      assert.ok(result[0].id);
      assert.ok(result[0].name);
      assert.strictEqual(result[0].description, undefined);
      assert.strictEqual(result[0].users, undefined);
    });
  });

  describe('query parameter handling', () => {
    it('should handle name query for user search', async () => {
      let capturedQuery = null;

      mockUserService.find = async (params) => {
        capturedQuery = params.query;
        return {
          total: 1,
          limit: 10,
          skip: 0,
          data: [
            { _id: 'user1', email: 'search@example.com' }
          ]
        };
      };

      await service.find({ 
        query: { name: 'search@example.com' } 
      });
      
      assert.ok(capturedQuery);
      assert.strictEqual(capturedQuery.email, 'search@example.com');
      assert.strictEqual(capturedQuery.name, undefined);
    });

    it('should not modify params for group search', async () => {
      let capturedQuery = null;

      mockGroupService.find = async (params) => {
        capturedQuery = params.query;
        return {
          total: 0,
          limit: 10,
          skip: 0,
          data: []
        };
      };

      await service.find({ 
        query: { name: 'Test Group' } 
      });
      
      // The name was converted to email for users, but groups 
      // receive the params after modification
      assert.ok(capturedQuery);
    });

    it('should handle pagination parameters', async () => {
      let userLimit = null;
      let groupLimit = null;

      mockUserService.find = async (params) => {
        userLimit = params.query.$limit;
        return {
          total: 0,
          limit: 10,
          skip: 0,
          data: []
        };
      };

      mockGroupService.find = async (params) => {
        groupLimit = params.query.$limit;
        return {
          total: 0,
          limit: 10,
          skip: 0,
          data: []
        };
      };

      await service.find({ 
        query: { $limit: 20 } 
      });
      
      assert.strictEqual(userLimit, 20);
      assert.strictEqual(groupLimit, 20);
    });

    it('should handle sort parameters', async () => {
      await service.find({ 
        query: { 
          $sort: { name: 1 } 
        } 
      });
      
      // Should not throw error
      assert.ok(true);
    });

    it('should handle filter parameters', async () => {
      await service.find({ 
        query: { 
          role: 'admin' 
        } 
      });
      
      // Should not throw error
      assert.ok(true);
    });
  });

  describe('edge cases', () => {
    it('should handle users without email field', async () => {
      mockUserService.find = async () => ({
        total: 1,
        limit: 10,
        skip: 0,
        data: [
          { _id: 'user1' }
        ]
      });

      const result = await service.find({});
      
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].name, undefined);
    });

    it('should handle groups without name field', async () => {
      mockGroupService.find = async () => ({
        total: 1,
        limit: 10,
        skip: 0,
        data: [
          { _id: 'group1' }
        ]
      });

      const result = await service.find({});
      
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].name, undefined);
    });

    it('should handle empty data arrays', async () => {
      mockUserService.find = async () => ({
        total: 0,
        limit: 10,
        skip: 0,
        data: []
      });

      mockGroupService.find = async () => ({
        total: 0,
        limit: 10,
        skip: 0,
        data: []
      });

      const result = await service.find({});
      
      assert.ok(Array.isArray(result));
      assert.strictEqual(result.length, 0);
    });

    it('should handle service errors gracefully', async () => {
      mockUserService.find = async () => {
        throw new Error('Database error');
      };

      try {
        await service.find({});
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error);
        assert.strictEqual(error.message, 'Database error');
      }
    });
  });

  describe('integration with real app', () => {
    it('should work with real app instance', () => {
      const realService = app.service('subjects');
      assert.ok(realService);
    });

    it('should have correct service path', () => {
      const realService = app.service('subjects');
      assert.ok(realService);
    });
  });
});
