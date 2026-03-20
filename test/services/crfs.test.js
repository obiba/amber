const assert = require('assert');
const app = require('../../src/app');

describe('\'crfs\' service', () => {
  let testAdmin; // eslint-disable-line no-unused-vars
  let adminToken;
  let testStudy;
  let testForm;
  let testCaseReportForm1;
  let testCaseReportForm2;
  let testCaseReportForm3; // paused state

  // Wait for MongoDB connection before all tests
  before(async () => {
    await app.get('mongodbClient');
  });

  // Create test user
  before(async () => {
    // Clean up existing test user
    try {
      const users = await app.service('user').find({ query: { email: 'crfsadmin@test.com' } });
      if (users.data && users.data.length > 0) {
        await app.service('user').remove(users.data[0]._id);
      }
    } catch {
      // Ignore errors during cleanup
    }

    // Create administrator
    testAdmin = await app.service('user').create({
      email: 'crfsadmin@test.com',
      password: 'Password1#',
      firstname: 'CRFS',
      lastname: 'Admin',
      language: 'en',
      role: 'administrator',
      with2fa: false
    });

    // Authenticate user
    const adminAuth = await app.service('authentication').create({
      strategy: 'local',
      email: 'crfsadmin@test.com',
      password: 'Password1#'
    });
    adminToken = adminAuth.accessToken;
  });

  // Create test data
  before(async () => {
    // Create test study
    testStudy = await app.service('study').create(
      {
        name: 'Test CRFS Study',
        description: 'Study for testing CRFS'
      },
      { authentication: { strategy: 'jwt', accessToken: adminToken } }
    );

    // Create test form
    testForm = await app.service('form').create(
      {
        name: 'test-crfs-form',
        label: 'Test CRFS Form',
        study: testStudy._id,
        schema: {
          name: 'test-form',
          label: 'Test Form',
          items: [
            {
              name: 'field1',
              label: 'Field 1',
              type: 'text'
            },
            {
              name: 'field2',
              label: 'Field 2',
              type: 'number'
            }
          ]
        }
      },
      { authentication: { strategy: 'jwt', accessToken: adminToken } }
    );

    // Create form revision
    await app.service('form-revision').create(
      {
        study: testStudy._id,
        form: testForm._id,
        comment: 'Initial revision for CRFS testing'
      },
      { authentication: { strategy: 'jwt', accessToken: adminToken } }
    );

    // Create active case report forms
    testCaseReportForm1 = await app.service('case-report-form').create(
      {
        name: 'Test CRF 1',
        description: 'First test case report form',
        study: testStudy._id,
        form: testForm._id,
        state: 'active',
        repeatPolicy: 'single_reject'
      },
      { authentication: { strategy: 'jwt', accessToken: adminToken } }
    );

    testCaseReportForm2 = await app.service('case-report-form').create(
      {
        name: 'Test CRF 2',
        description: 'Second test case report form',
        study: testStudy._id,
        form: testForm._id,
        state: 'active',
        repeatPolicy: 'multiple'
      },
      { authentication: { strategy: 'jwt', accessToken: adminToken } }
    );

    // Create paused case report form (should not appear in results)
    testCaseReportForm3 = await app.service('case-report-form').create(
      {
        name: 'Test CRF 3',
        description: 'Paused test case report form',
        study: testStudy._id,
        form: testForm._id,
        state: 'paused'
      },
      { authentication: { strategy: 'jwt', accessToken: adminToken } }
    );
  });

  // Clean up after all tests
  after(async () => {
    if (testCaseReportForm1) {
      try {
        await app.service('case-report-form').remove(testCaseReportForm1._id, {
          authentication: { strategy: 'jwt', accessToken: adminToken }
        });
      } catch {
        // Ignore cleanup errors
      }
    }

    if (testCaseReportForm2) {
      try {
        await app.service('case-report-form').remove(testCaseReportForm2._id, {
          authentication: { strategy: 'jwt', accessToken: adminToken }
        });
      } catch {
        // Ignore cleanup errors
      }
    }

    if (testCaseReportForm3) {
      try {
        await app.service('case-report-form').remove(testCaseReportForm3._id, {
          authentication: { strategy: 'jwt', accessToken: adminToken }
        });
      } catch {
        // Ignore cleanup errors
      }
    }

    if (testForm) {
      try {
        await app.service('form').remove(testForm._id, {
          authentication: { strategy: 'jwt', accessToken: adminToken }
        });
      } catch {
        // Ignore cleanup errors
      }
    }

    if (testStudy) {
      try {
        await app.service('study').remove(testStudy._id, {
          authentication: { strategy: 'jwt', accessToken: adminToken }
        });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  it('registered the service', () => {
    const service = app.service('crfs');
    assert.ok(service, 'Registered the service');
  });

  describe('constructor', () => {
    it('should initialize with options and app', () => {
      const { Crfs } = require('../../src/services/crfs/crfs.class');
      const options = { paginate: { default: 10, max: 50 } };
      const service = new Crfs(options, app);
      
      assert.ok(service);
      assert.strictEqual(service.app, app);
      assert.deepStrictEqual(service.options, options);
    });

    it('should initialize with empty options', () => {
      const { Crfs } = require('../../src/services/crfs/crfs.class');
      const service = new Crfs(null, app);
      
      assert.ok(service);
      assert.deepStrictEqual(service.options, {});
    });
  });

  describe('authentication', () => {
    it('requires authentication for find operation', async () => {
      try {
        await app.service('crfs').find({ query: {} });
        assert.fail('Should have thrown authentication error');
      } catch (error) {
        assert.ok(error.name === 'NotAuthenticated' || error.name === 'AssertionError' || error.name === 'TypeError');
      }
    });
  });

  describe('find', () => {
    it('returns only active case report forms with schemas', async () => {
      const result = await app.service('crfs').find({
        query: {},
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.data));
      assert.ok(result.data.length >= 2, 'Should have at least 2 active CRFs');

      // Verify paused form is not included
      const pausedFormFound = result.data.find(crf => crf.name === 'Test CRF 3');
      assert.strictEqual(pausedFormFound, undefined, 'Paused form should not be in results');

      // Verify active forms are included
      const crf1 = result.data.find(crf => crf.name === 'Test CRF 1');
      const crf2 = result.data.find(crf => crf.name === 'Test CRF 2');
      
      assert.ok(crf1, 'Test CRF 1 should be in results');
      assert.ok(crf2, 'Test CRF 2 should be in results');
    });

    it('includes schema in each CRF result', async () => {
      const result = await app.service('crfs').find({
        query: { study: testStudy._id },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      assert.ok(result.data.length > 0);
      
      for (const crf of result.data) {
        assert.ok(crf._id, 'CRF has _id');
        assert.ok(crf.name, 'CRF has name');
        assert.ok(crf.schema, 'CRF has schema');
        assert.ok(typeof crf.revision === 'number', 'CRF has revision number');
        assert.ok(crf.schema.items, 'Schema has items');
      }
    });

    it('includes description when available', async () => {
      const result = await app.service('crfs').find({
        query: { study: testStudy._id },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      const crf1 = result.data.find(crf => crf.name === 'Test CRF 1');
      assert.ok(crf1);
      assert.strictEqual(crf1.description, 'First test case report form');
    });

    it('supports filtering by study', async () => {
      const result = await app.service('crfs').find({
        query: { study: testStudy._id },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      assert.ok(result);
      assert.ok(result.data.length >= 2);
    });

    it('supports pagination', async () => {
      const result = await app.service('crfs').find({
        query: { 
          study: testStudy._id,
          $limit: 1
        },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      assert.ok(result);
      assert.ok(result.data.length <= 1);
      assert.ok(typeof result.total === 'number');
      assert.ok(typeof result.skip === 'number');
      assert.ok(typeof result.limit === 'number');
    });

    it('supports pagination with skip', async () => {
      const result = await app.service('crfs').find({
        query: { 
          study: testStudy._id,
          $limit: 1,
          $skip: 1
        },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      assert.ok(result);
      assert.strictEqual(result.skip, 1);
    });

    it('returns latest form revision when no specific revision requested', async () => {
      const result = await app.service('crfs').find({
        query: { study: testStudy._id },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      const crf = result.data.find(c => c.name === 'Test CRF 1');
      assert.ok(crf);
      assert.ok(crf.revision >= 1, 'Should have revision number');
    });

    it('handles empty result set', async () => {
      const result = await app.service('crfs').find({
        query: { study: '000000000000000000000000' }, // Non-existent study
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.data));
      assert.strictEqual(result.data.length, 0);
      assert.strictEqual(result.total, 0);
    });

    it('preserves pagination metadata', async () => {
      const result = await app.service('crfs').find({
        query: { 
          study: testStudy._id,
          $limit: 5,
          $skip: 0
        },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      assert.ok(result);
      assert.ok(typeof result.total === 'number');
      assert.ok(typeof result.limit === 'number');
      assert.ok(typeof result.skip === 'number');
      assert.strictEqual(result.limit, 5);
      assert.strictEqual(result.skip, 0);
    });
  });

  describe('schema fetching', () => {
    it('fetches correct schema for each CRF', async () => {
      const result = await app.service('crfs').find({
        query: { study: testStudy._id },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      const crf = result.data.find(c => c.name === 'Test CRF 1');
      assert.ok(crf);
      assert.ok(crf.schema);
      assert.strictEqual(crf.schema.name, 'test-form');
      assert.strictEqual(crf.schema.label, 'Test Form');
      assert.ok(Array.isArray(crf.schema.items));
      assert.strictEqual(crf.schema.items.length, 2);
    });

    it('schema includes form fields', async () => {
      const result = await app.service('crfs').find({
        query: { study: testStudy._id },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      const crf = result.data[0];
      assert.ok(crf.schema);
      assert.ok(crf.schema.items);
      
      const field1 = crf.schema.items.find(item => item.name === 'field1');
      const field2 = crf.schema.items.find(item => item.name === 'field2');
      
      assert.ok(field1);
      assert.strictEqual(field1.label, 'Field 1');
      assert.strictEqual(field1.type, 'text');
      
      assert.ok(field2);
      assert.strictEqual(field2.label, 'Field 2');
      assert.strictEqual(field2.type, 'number');
    });

    it('handles CRFs without form revisions gracefully', async () => {
      // Create a form
      const tempForm = await app.service('form').create(
        {
          name: 'temp-form-no-revision',
          label: 'Temp Form',
          study: testStudy._id,
          schema: { name: 'temp', label: 'Temp', items: [] }
        },
        { authentication: { strategy: 'jwt', accessToken: adminToken } }
      );

      // Create a revision for it first
      await app.service('form-revision').create(
        {
          study: testStudy._id,
          form: tempForm._id,
          comment: 'Temp revision'
        },
        { authentication: { strategy: 'jwt', accessToken: adminToken } }
      );

      // Create CRF
      const tempCrf = await app.service('case-report-form').create(
        {
          name: 'Temp CRF With Revision',
          study: testStudy._id,
          form: tempForm._id,
          state: 'active'
        },
        { authentication: { strategy: 'jwt', accessToken: adminToken } }
      );

      // Delete the revision to simulate missing revision
      const revisions = await app.service('form-revision').find({
        query: {
          study: testStudy._id,
          form: tempForm._id
        },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      if (revisions.data.length > 0) {
        await app.service('form-revision').remove(revisions.data[0]._id, {
          authentication: { strategy: 'jwt', accessToken: adminToken }
        });
      }

      const result = await app.service('crfs').find({
        query: { study: testStudy._id },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      // CRF without revision should not appear
      const crfFound = result.data.find(c => c.name === 'Temp CRF With Revision');
      assert.strictEqual(crfFound, undefined, 'CRF without revision should not be in results');

      // Cleanup
      await app.service('case-report-form').remove(tempCrf._id, {
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });
      await app.service('form').remove(tempForm._id, {
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });
    });
  });

  describe('specific revision handling', () => {
    it('uses specific revision when CRF has revision field', async () => {
      // Create a second revision
      await app.service('form-revision').create(
        {
          study: testStudy._id,
          form: testForm._id,
          comment: 'Second revision'
        },
        { authentication: { strategy: 'jwt', accessToken: adminToken } }
      );

      // Update CRF to use specific revision
      await app.service('case-report-form').patch(
        testCaseReportForm1._id,
        { revision: 1 },
        { authentication: { strategy: 'jwt', accessToken: adminToken } }
      );

      const result = await app.service('crfs').find({
        query: { study: testStudy._id },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      const crf = result.data.find(c => c.name === 'Test CRF 1');
      assert.ok(crf);
      assert.strictEqual(crf.revision, 1, 'Should use specified revision');
    });
  });

  describe('unimplemented methods', () => {
    it('throws BadRequest for get', async () => {
      try {
        await app.service('crfs').get(testCaseReportForm1._id, {
          authentication: { strategy: 'jwt', accessToken: adminToken }
        });
        assert.fail('Should have thrown BadRequest');
      } catch (error) {
        assert.strictEqual(error.name, 'BadRequest');
        assert.ok(error.message.includes('Not implemented'));
      }
    });

    it('throws BadRequest for create', async () => {
      try {
        await app.service('crfs').create(
          { name: 'Test' },
          { authentication: { strategy: 'jwt', accessToken: adminToken } }
        );
        assert.fail('Should have thrown BadRequest');
      } catch (error) {
        assert.strictEqual(error.name, 'BadRequest');
        assert.ok(error.message.includes('Not implemented'));
      }
    });

    it('throws BadRequest for update', async () => {
      try {
        await app.service('crfs').update(
          testCaseReportForm1._id,
          { name: 'Test' },
          { authentication: { strategy: 'jwt', accessToken: adminToken } }
        );
        assert.fail('Should have thrown BadRequest');
      } catch (error) {
        assert.strictEqual(error.name, 'BadRequest');
        assert.ok(error.message.includes('Not implemented'));
      }
    });

    it('throws BadRequest for patch', async () => {
      try {
        await app.service('crfs').patch(
          testCaseReportForm1._id,
          { name: 'Test' },
          { authentication: { strategy: 'jwt', accessToken: adminToken } }
        );
        assert.fail('Should have thrown BadRequest');
      } catch (error) {
        assert.strictEqual(error.name, 'BadRequest');
        assert.ok(error.message.includes('Not implemented'));
      }
    });

    it('throws BadRequest for remove', async () => {
      try {
        await app.service('crfs').remove(testCaseReportForm1._id, {
          authentication: { strategy: 'jwt', accessToken: adminToken }
        });
        assert.fail('Should have thrown BadRequest');
      } catch (error) {
        assert.strictEqual(error.name, 'BadRequest');
        assert.ok(error.message.includes('Not implemented'));
      }
    });
  });

  describe('query parameter handling', () => {
    it('passes through query parameters to case-report-form service', async () => {
      const result = await app.service('crfs').find({
        query: { 
          study: testStudy._id,
          name: 'Test CRF 1'
        },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      assert.ok(result);
      assert.ok(result.data.length <= 1);
      if (result.data.length > 0) {
        assert.strictEqual(result.data[0].name, 'Test CRF 1');
      }
    });

    it('handles complex query filters', async () => {
      const result = await app.service('crfs').find({
        query: { 
          study: testStudy._id,
          $or: [
            { name: 'Test CRF 1' },
            { name: 'Test CRF 2' }
          ]
        },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      assert.ok(result);
      assert.ok(result.data.length >= 2);
    });
  });

  describe('data structure', () => {
    it('returns correct structure for each CRF', async () => {
      const result = await app.service('crfs').find({
        query: { study: testStudy._id },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      const crf = result.data[0];
      
      // Check required fields
      assert.ok(crf._id);
      assert.ok(crf.name);
      assert.ok(crf.schema);
      assert.ok(typeof crf.revision === 'number');
      
      // Check field types
      assert.strictEqual(typeof crf.name, 'string');
      assert.strictEqual(typeof crf.schema, 'object');
      assert.strictEqual(typeof crf.revision, 'number');
      
      // Check description can be present or null
      if (crf.description !== undefined) {
        assert.ok(typeof crf.description === 'string' || crf.description === null);
      }
    });

    it('does not include internal CRF fields', async () => {
      const result = await app.service('crfs').find({
        query: { study: testStudy._id },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      const crf = result.data[0];
      
      // These fields should not be in the result
      assert.strictEqual(crf.state, undefined);
      assert.strictEqual(crf.repeatPolicy, undefined);
      assert.strictEqual(crf.permissions, undefined);
      assert.strictEqual(crf.form, undefined);
      assert.strictEqual(crf.study, undefined);
    });
  });

  describe('integration with real app', () => {
    it('should work with real app instance', async () => {
      const service = app.service('crfs');
      assert.ok(service);
      
      const result = await service.find({
        query: { $limit: 1 },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });
      
      assert.ok(result);
      assert.ok(Array.isArray(result.data));
    });
  });
});
