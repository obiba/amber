const assert = require('assert');
const appPromise = require('../../src/app');
let app;
const { FormRevisionDigest } = require('../../src/services/form-revision-digest/form-revision-digest.class');
const { BadRequest } = require('@feathersjs/errors');

before(async function() { this.timeout(30000); app = await appPromise; });

describe('\'form-revision-digest\' service', () => {
  let service;
  let mockApp;
  let mockServices;

  beforeEach(() => {
    // Create mock services
    mockServices = {
      'form-revision': {
        find: async () => ({
          total: 2,
          limit: 10,
          skip: 0,
          data: [
            {
              _id: 'rev1',
              form: 'form1',
              revision: 1,
              name: 'Form Revision 1',
              schema: {
                items: [
                  { name: 'field1', type: 'text', label: 'Field 1' },
                  { name: 'field2', type: 'number', label: 'Field 2' }
                ],
                i18n: {
                  en: { title: 'Form' }
                }
              },
              createdAt: new Date('2024-01-01')
            },
            {
              _id: 'rev2',
              form: 'form1',
              revision: 2,
              name: 'Form Revision 2',
              schema: {
                items: [
                  { name: 'field1', type: 'text', label: 'Field 1' },
                  { name: 'field2', type: 'number', label: 'Field 2' },
                  { name: 'field3', type: 'select', label: 'Field 3' }
                ],
                i18n: {
                  en: { title: 'Form Updated' }
                }
              },
              createdAt: new Date('2024-02-01')
            }
          ]
        })
      }
    };

    // Create mock app
    mockApp = {
      service: (name) => mockServices[name],
      get: (key) => {
        const config = {
          paginate: { max: 1000, default: 10 }
        };
        return config[key];
      }
    };

    service = new FormRevisionDigest({ paginate: { max: 1000 } }, mockApp);
  });

  describe('service registration', () => {
    it('registered the service', () => {
      const registeredService = app.service('form-revision-digest');
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
      const serviceWithoutOptions = new FormRevisionDigest(null, mockApp);
      assert.ok(serviceWithoutOptions.options);
      assert.deepStrictEqual(serviceWithoutOptions.options, {});
    });
  });

  describe('find', () => {
    it('should return form revisions without schema', async () => {
      const result = await service.find({ query: {} });

      assert.ok(result);
      assert.strictEqual(result.total, 2);
      assert.ok(Array.isArray(result.data));
      assert.strictEqual(result.data.length, 2);
    });

    it('should remove schema from all revisions', async () => {
      const result = await service.find({ query: {} });

      result.data.forEach(rev => {
        assert.ok(!rev.schema, 'Schema should be removed');
      });
    });

    it('should preserve other revision fields', async () => {
      const result = await service.find({ query: {} });

      assert.strictEqual(result.data[0]._id, 'rev1');
      assert.strictEqual(result.data[0].form, 'form1');
      assert.strictEqual(result.data[0].revision, 1);
      assert.strictEqual(result.data[0].name, 'Form Revision 1');
      assert.ok(result.data[0].createdAt);
    });

    it('should preserve pagination info', async () => {
      const result = await service.find({ query: {} });

      assert.strictEqual(result.total, 2);
      assert.strictEqual(result.limit, 10);
      assert.strictEqual(result.skip, 0);
    });

    it('should pass query params to form-revision service', async () => {
      let receivedParams = null;
      mockServices['form-revision'].find = async (params) => {
        receivedParams = params;
        return {
          total: 1,
          data: [{
            _id: 'rev1',
            form: 'form1',
            revision: 1,
            schema: { items: [] }
          }]
        };
      };

      await service.find({ 
        query: { 
          form: 'form1', 
          $limit: 20,
          $skip: 10 
        } 
      });

      assert.ok(receivedParams);
      assert.strictEqual(receivedParams.query.form, 'form1');
      assert.strictEqual(receivedParams.query.$limit, 20);
      assert.strictEqual(receivedParams.query.$skip, 10);
    });

    it('should handle empty results', async () => {
      mockServices['form-revision'].find = async () => ({
        total: 0,
        limit: 10,
        skip: 0,
        data: []
      });

      const result = await service.find({ query: {} });

      assert.strictEqual(result.total, 0);
      assert.strictEqual(result.data.length, 0);
    });

    it('should handle single revision', async () => {
      mockServices['form-revision'].find = async () => ({
        total: 1,
        data: [{
          _id: 'rev1',
          form: 'form1',
          revision: 1,
          name: 'Single Revision',
          schema: { items: [{ name: 'field1', type: 'text' }] }
        }]
      });

      const result = await service.find({ query: {} });

      assert.strictEqual(result.total, 1);
      assert.strictEqual(result.data.length, 1);
      assert.ok(!result.data[0].schema);
      assert.strictEqual(result.data[0].name, 'Single Revision');
    });

    it('should handle revisions with complex metadata', async () => {
      mockServices['form-revision'].find = async () => ({
        total: 1,
        data: [{
          _id: 'rev1',
          form: 'form1',
          revision: 1,
          name: 'Complex Revision',
          description: 'A detailed description',
          tags: ['medical', 'intake'],
          schema: { 
            items: [
              { name: 'field1', type: 'text' },
              { 
                name: 'group1', 
                type: 'group',
                items: [
                  { name: 'nested1', type: 'number' }
                ]
              }
            ],
            i18n: {
              en: { title: 'English Title' },
              fr: { title: 'Titre Français' }
            }
          },
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20')
        }]
      });

      const result = await service.find({ query: {} });

      assert.strictEqual(result.data[0].name, 'Complex Revision');
      assert.strictEqual(result.data[0].description, 'A detailed description');
      assert.deepStrictEqual(result.data[0].tags, ['medical', 'intake']);
      assert.ok(!result.data[0].schema);
      assert.ok(result.data[0].createdAt);
      assert.ok(result.data[0].updatedAt);
    });

    it('should handle filter by form ID', async () => {
      let queryReceived = null;
      mockServices['form-revision'].find = async (params) => {
        queryReceived = params.query;
        return {
          total: 1,
          data: [{
            _id: 'rev1',
            form: 'form123',
            revision: 1,
            schema: { items: [] }
          }]
        };
      };

      await service.find({ query: { form: 'form123' } });

      assert.strictEqual(queryReceived.form, 'form123');
    });

    it('should handle filter by revision number', async () => {
      let queryReceived = null;
      mockServices['form-revision'].find = async (params) => {
        queryReceived = params.query;
        return {
          total: 1,
          data: [{
            _id: 'rev1',
            form: 'form1',
            revision: 5,
            schema: { items: [] }
          }]
        };
      };

      await service.find({ query: { revision: 5 } });

      assert.strictEqual(queryReceived.revision, 5);
    });

    it('should handle sorting parameters', async () => {
      let queryReceived = null;
      mockServices['form-revision'].find = async (params) => {
        queryReceived = params.query;
        return {
          total: 1,
          data: [{
            _id: 'rev1',
            form: 'form1',
            revision: 1,
            schema: { items: [] }
          }]
        };
      };

      await service.find({ 
        query: { 
          $sort: { revision: -1 } 
        } 
      });

      assert.ok(queryReceived.$sort);
      assert.strictEqual(queryReceived.$sort.revision, -1);
    });

    it('should handle large result sets', async () => {
      const largeDataSet = [];
      for (let i = 1; i <= 50; i++) {
        largeDataSet.push({
          _id: `rev${i}`,
          form: 'form1',
          revision: i,
          name: `Revision ${i}`,
          schema: {
            items: [
              { name: 'field1', type: 'text' }
            ]
          }
        });
      }

      mockServices['form-revision'].find = async () => ({
        total: 50,
        limit: 50,
        skip: 0,
        data: largeDataSet
      });

      const result = await service.find({ query: { $limit: 50 } });

      assert.strictEqual(result.total, 50);
      assert.strictEqual(result.data.length, 50);
      
      // Verify schema removed from all
      result.data.forEach(rev => {
        assert.ok(!rev.schema);
      });
      
      // Verify data integrity
      assert.strictEqual(result.data[0].revision, 1);
      assert.strictEqual(result.data[49].revision, 50);
    });

    it('should handle revisions without schema field', async () => {
      mockServices['form-revision'].find = async () => ({
        total: 1,
        data: [{
          _id: 'rev1',
          form: 'form1',
          revision: 1,
          name: 'No Schema Revision'
        }]
      });

      const result = await service.find({ query: {} });

      assert.strictEqual(result.data.length, 1);
      assert.ok(!result.data[0].schema);
      assert.strictEqual(result.data[0].name, 'No Schema Revision');
    });

    it('should handle revisions with null schema', async () => {
      mockServices['form-revision'].find = async () => ({
        total: 1,
        data: [{
          _id: 'rev1',
          form: 'form1',
          revision: 1,
          name: 'Null Schema',
          schema: null
        }]
      });

      const result = await service.find({ query: {} });

      assert.strictEqual(result.data.length, 1);
      assert.ok(!result.data[0].schema);
    });

    it('should handle combined filters', async () => {
      let queryReceived = null;
      mockServices['form-revision'].find = async (params) => {
        queryReceived = params.query;
        return {
          total: 1,
          data: [{
            _id: 'rev1',
            form: 'form1',
            revision: 3,
            schema: { items: [] }
          }]
        };
      };

      await service.find({ 
        query: { 
          form: 'form1',
          revision: { $gte: 3 },
          $limit: 5,
          $skip: 0
        } 
      });

      assert.strictEqual(queryReceived.form, 'form1');
      assert.deepStrictEqual(queryReceived.revision, { $gte: 3 });
      assert.strictEqual(queryReceived.$limit, 5);
    });
  });

  describe('unimplemented methods', () => {
    it('should throw BadRequest for get', async () => {
      try {
        await service.get('123', {});
        assert.fail('Should have thrown BadRequest');
      } catch (err) {
        assert.ok(err instanceof BadRequest);
        assert.strictEqual(err.message, 'Not implemented');
      }
    });

    it('should throw BadRequest for create', async () => {
      try {
        await service.create({}, {});
        assert.fail('Should have thrown BadRequest');
      } catch (err) {
        assert.ok(err instanceof BadRequest);
        assert.strictEqual(err.message, 'Not implemented');
      }
    });

    it('should throw BadRequest for update', async () => {
      try {
        await service.update('123', {}, {});
        assert.fail('Should have thrown BadRequest');
      } catch (err) {
        assert.ok(err instanceof BadRequest);
        assert.strictEqual(err.message, 'Not implemented');
      }
    });

    it('should throw BadRequest for patch', async () => {
      try {
        await service.patch('123', {}, {});
        assert.fail('Should have thrown BadRequest');
      } catch (err) {
        assert.ok(err instanceof BadRequest);
        assert.strictEqual(err.message, 'Not implemented');
      }
    });

    it('should throw BadRequest for remove', async () => {
      try {
        await service.remove('123', {});
        assert.fail('Should have thrown BadRequest');
      } catch (err) {
        assert.ok(err instanceof BadRequest);
        assert.strictEqual(err.message, 'Not implemented');
      }
    });
  });

  describe('integration with real app', () => {
    it('should work with real app instance', () => {
      const realService = app.service('form-revision-digest');
      assert.ok(realService);
    });
  });
});
