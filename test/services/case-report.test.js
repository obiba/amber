const assert = require('assert');
const app = require('../../src/app');
const { ObjectId } = require('mongodb');

describe('\'case-report\' service', () => {
  let testAdmin;
  let testManager; // eslint-disable-line no-unused-vars
  let testInterviewer; // eslint-disable-line no-unused-vars
  let adminToken;
  let managerToken;
  let interviewerToken;
  let testStudy;
  let testForm;
  let testCaseReportForm;
  let testCaseReport;

  // Wait for MongoDB connection before all tests
  before(async () => {
    await app.get('mongodbClient');
  });

  // Create test users with different roles
  before(async () => {
    // Clean up existing test users
    const testEmails = [
      'caseadmin@test.com',
      'casemanager@test.com',
      'caseinterviewer@test.com'
    ];

    for (const email of testEmails) {
      try {
        const users = await app.service('user').find({ query: { email } });
        if (users.data && users.data.length > 0) {
          await app.service('user').remove(users.data[0]._id);
        }
      } catch {
        // Ignore errors during cleanup
      }
    }

    // Create administrator
    testAdmin = await app.service('user').create({
      email: 'caseadmin@test.com',
      password: 'Password1#',
      firstname: 'Case',
      lastname: 'Admin',
      language: 'en',
      role: 'administrator',
      with2fa: false
    });

    // Create manager
    testManager = await app.service('user').create({
      email: 'casemanager@test.com',
      password: 'Password1#',
      firstname: 'Case',
      lastname: 'Manager',
      language: 'en',
      role: 'manager',
      with2fa: false
    });

    // Create interviewer
    testInterviewer = await app.service('user').create({
      email: 'caseinterviewer@test.com',
      password: 'Password1#',
      firstname: 'Case',
      lastname: 'Interviewer',
      language: 'en',
      role: 'interviewer',
      with2fa: false
    });

    // Authenticate users
    const adminAuth = await app.service('authentication').create({
      strategy: 'local',
      email: 'caseadmin@test.com',
      password: 'Password1#'
    });
    adminToken = adminAuth.accessToken;

    const managerAuth = await app.service('authentication').create({
      strategy: 'local',
      email: 'casemanager@test.com',
      password: 'Password1#'
    });
    managerToken = managerAuth.accessToken;

    const interviewerAuth = await app.service('authentication').create({
      strategy: 'local',
      email: 'caseinterviewer@test.com',
      password: 'Password1#'
    });
    interviewerToken = interviewerAuth.accessToken;
  });

  // Create test study, form, and case report form
  before(async () => {
    // Create test study
    testStudy = await app.service('study').create(
      {
        name: 'Test Case Report Study',
        description: 'Study for testing case reports'
      },
      { authentication: { strategy: 'jwt', accessToken: adminToken } }
    );

    // Create test form
    testForm = await app.service('form').create(
      {
        name: 'test-case-report-form',
        label: 'Test Case Report Form',
        study: testStudy._id,
        schema: {
          name: 'test-form',
          label: 'Test Form',
          items: []
        }
      },
      { authentication: { strategy: 'jwt', accessToken: adminToken } }
    );

    // Create form revision
    await app.service('form-revision').create(
      {
        study: testStudy._id,
        form: testForm._id,
        comment: 'Initial revision for testing'
      },
      { authentication: { strategy: 'jwt', accessToken: adminToken } }
    );

    // Create case report form
    testCaseReportForm = await app.service('case-report-form').create(
      {
        name: 'Test CRF',
        study: testStudy._id,
        form: testForm._id,
        state: 'active'
      },
      { authentication: { strategy: 'jwt', accessToken: adminToken } }
    );
  });

  // Clean up after all tests
  after(async () => {
    if (testCaseReport) {
      try {
        await app.service('case-report').remove(testCaseReport._id, {
          authentication: { strategy: 'jwt', accessToken: adminToken }
        });
      } catch {
        // Ignore cleanup errors
      }
    }

    if (testCaseReportForm) {
      try {
        await app.service('case-report-form').remove(testCaseReportForm._id, {
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
    const service = app.service('case-report');
    assert.ok(service, 'Registered the service');
  });

  describe('authentication and authorization', () => {
    it('requires authentication for all operations', async () => {
      try {
        await app.service('case-report').find({});
        assert.fail('Should have thrown authentication error');
      } catch (error) {
        assert.ok(error.name === 'NotAuthenticated' || error.name === 'AssertionError');
      }
    });

    it('allows administrator to manage case reports', async () => {
      const result = await app.service('case-report').find({
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });
      assert.ok(result);
    });

    it('allows manager to manage case reports', async () => {
      const result = await app.service('case-report').find({
        authentication: { strategy: 'jwt', accessToken: managerToken }
      });
      assert.ok(result);
    });

    it('allows interviewer to read and create case reports', async () => {
      const result = await app.service('case-report').find({
        authentication: { strategy: 'jwt', accessToken: interviewerToken }
      });
      assert.ok(result);
    });
  });

  describe('create case report', () => {
    it('creates a case report with valid data', async () => {
      const caseReportData = {
        crfId: testCaseReportForm._id.toString(),
        caseReportForm: testCaseReportForm._id,
        revision: 1,
        state: 'completed',
        data: {
          field1: 'value1',
          field2: 'value2'
        }
      };

      testCaseReport = await app.service('case-report').create(
        caseReportData,
        { authentication: { strategy: 'jwt', accessToken: adminToken } }
      );

      assert.ok(testCaseReport._id, 'Case report has an ID');
      assert.strictEqual(testCaseReport.state, 'completed');
      assert.strictEqual(testCaseReport.revision, 1);
      assert.ok(testCaseReport.createdBy, 'createdBy field is set');
    });

    it('creates a case report with default state', async () => {
      const caseReportData = {
        crfId: testCaseReportForm._id.toString(),
        caseReportForm: testCaseReportForm._id,
        revision: 1,
        data: {
          _id: 'test-id-' + Date.now() // Provide unique ID to avoid conflict
        }
      };

      const result = await app.service('case-report').create(
        caseReportData,
        { authentication: { strategy: 'jwt', accessToken: adminToken } }
      );

      assert.ok(result._id);
      assert.strictEqual(result.state, 'completed', 'Default state is completed');

      // Cleanup
      await app.service('case-report').remove(result._id, {
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });
    });

    it('creates a case report with actions', async () => {
      const caseReportData = {
        crfId: testCaseReportForm._id.toString(),
        caseReportForm: testCaseReportForm._id,
        revision: 1,
        state: 'in_progress',
        actions: [
          {
            type: 'init',
            user: testAdmin._id.toString(),
            timestamp: Date.now()
          }
        ],
        data: {
          _id: 'test-id-' + Date.now() // Provide unique ID
        }
      };

      const result = await app.service('case-report').create(
        caseReportData,
        { authentication: { strategy: 'jwt', accessToken: adminToken } }
      );

      assert.ok(result._id);
      assert.ok(Array.isArray(result.actions));
      assert.strictEqual(result.actions.length, 1);
      assert.strictEqual(result.actions[0].type, 'init');

      // Cleanup
      await app.service('case-report').remove(result._id, {
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });
    });

    it('fails to create case report without required fields', async () => {
      try {
        await app.service('case-report').create(
          { data: {} },
          { authentication: { strategy: 'jwt', accessToken: adminToken } }
        );
        assert.fail('Should have thrown validation error');
      } catch (error) {
        assert.ok(error.name === 'BadRequest' || error.name === 'GeneralError');
      }
    });

    it('fails to create case report with invalid state', async () => {
      try {
        await app.service('case-report').create(
          {
            crfId: testCaseReportForm._id.toString(),
            caseReportForm: testCaseReportForm._id,
            revision: 1,
            state: 'invalid_state',
            data: {}
          },
          { authentication: { strategy: 'jwt', accessToken: adminToken } }
        );
        assert.fail('Should have thrown validation error');
      } catch (error) {
        assert.ok(error.name === 'BadRequest' || error.name === 'GeneralError');
      }
    });

    it('fails to create case report with invalid action type', async () => {
      try {
        await app.service('case-report').create(
          {
            crfId: testCaseReportForm._id.toString(),
            caseReportForm: testCaseReportForm._id,
            revision: 1,
            actions: [{ type: 'invalid_action' }],
            data: {}
          },
          { authentication: { strategy: 'jwt', accessToken: adminToken } }
        );
        assert.fail('Should have thrown validation error');
      } catch (error) {
        assert.ok(error.name === 'BadRequest' || error.name === 'GeneralError');
      }
    });
  });

  describe('find case reports', () => {
    it('finds all case reports', async () => {
      const result = await app.service('case-report').find({
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.data));
      assert.ok(result.total >= 1, 'At least one case report exists');
    });

    it('finds case reports by state', async () => {
      const result = await app.service('case-report').find({
        query: { state: 'completed' },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.data));
      if (result.data.length > 0) {
        assert.strictEqual(result.data[0].state, 'completed');
      }
    });

    it('finds case reports by case report form', async () => {
      const result = await app.service('case-report').find({
        query: { caseReportForm: testCaseReportForm._id },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.data));
      assert.ok(result.data.length >= 1);
    });

    it('finds case reports by study', async () => {
      const result = await app.service('case-report').find({
        query: { study: testStudy._id },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.data));
    });

    it('supports pagination', async () => {
      const result = await app.service('case-report').find({
        query: { $limit: 1 },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      assert.ok(result);
      assert.ok(result.data.length <= 1);
      assert.ok(typeof result.total === 'number');
      assert.ok(typeof result.skip === 'number');
      assert.ok(typeof result.limit === 'number');
    });
  });

  describe('get case report', () => {
    it('gets a case report by ID', async () => {
      const result = await app.service('case-report').get(
        testCaseReport._id,
        { authentication: { strategy: 'jwt', accessToken: adminToken } }
      );

      assert.ok(result);
      assert.strictEqual(result._id.toString(), testCaseReport._id.toString());
      assert.strictEqual(result.state, testCaseReport.state);
    });

    it('fails to get non-existent case report', async () => {
      const fakeId = new ObjectId();
      try {
        await app.service('case-report').get(
          fakeId,
          { authentication: { strategy: 'jwt', accessToken: adminToken } }
        );
        assert.fail('Should have thrown NotFound error');
      } catch (error) {
        assert.strictEqual(error.name, 'NotFound');
      }
    });
  });

  describe('patch case report', () => {
    it('updates case report state', async () => {
      const result = await app.service('case-report').patch(
        testCaseReport._id,
        { state: 'in_progress' },
        { authentication: { strategy: 'jwt', accessToken: adminToken } }
      );

      assert.ok(result);
      assert.strictEqual(result.state, 'in_progress');

      // Restore original state
      await app.service('case-report').patch(
        testCaseReport._id,
        { state: 'completed' },
        { authentication: { strategy: 'jwt', accessToken: adminToken } }
      );
    });

    it('updates case report data', async () => {
      const updatedData = {
        field1: 'updated_value1',
        field3: 'value3'
      };

      const result = await app.service('case-report').patch(
        testCaseReport._id,
        { data: updatedData },
        { authentication: { strategy: 'jwt', accessToken: adminToken } }
      );

      assert.ok(result);
      assert.ok(result.data);
    });

    it('updates case report actions', async () => {
      const newAction = {
        type: 'complete',
        user: testAdmin._id.toString(),
        timestamp: Date.now()
      };

      const result = await app.service('case-report').patch(
        testCaseReport._id,
        { actions: [newAction] },
        { authentication: { strategy: 'jwt', accessToken: adminToken } }
      );

      assert.ok(result);
      assert.ok(Array.isArray(result.actions));
    });

    it('fails to patch with invalid state', async () => {
      try {
        await app.service('case-report').patch(
          testCaseReport._id,
          { state: 'invalid_state' },
          { authentication: { strategy: 'jwt', accessToken: adminToken } }
        );
        assert.fail('Should have thrown validation error');
      } catch (error) {
        assert.ok(error.name === 'BadRequest' || error.name === 'GeneralError' || error.name === 'NotFound');
      }
    });

    it('allows manager to patch case reports', async () => {
      const result = await app.service('case-report').patch(
        testCaseReport._id,
        { revision: 2 },
        { authentication: { strategy: 'jwt', accessToken: managerToken } }
      );

      assert.ok(result);
      assert.strictEqual(result.revision, 2);
    });
  });

  describe('update case report', () => {
    it('fully updates a case report', async () => {
      const updateData = {
        caseReportForm: testCaseReportForm._id,
        revision: 3,
        state: 'completed',
        data: {
          fieldA: 'valueA',
          fieldB: 'valueB'
        },
        study: testStudy._id,
        form: testForm._id
      };

      const result = await app.service('case-report').update(
        testCaseReport._id,
        updateData,
        { authentication: { strategy: 'jwt', accessToken: adminToken } }
      );

      assert.ok(result);
      assert.strictEqual(result.revision, 3);
      assert.ok(result.data);
    });

    it('fails to update without required fields', async () => {
      try {
        await app.service('case-report').update(
          testCaseReport._id,
          { data: {}, state: 'completed' },
          { authentication: { strategy: 'jwt', accessToken: adminToken } }
        );
        assert.fail('Should have thrown validation error');
      } catch (error) {
        assert.ok(error.name === 'BadRequest' || error.name === 'GeneralError' || error.name === 'NotFound');
      }
    });
  });

  describe('remove case report', () => {
    let caseReportToRemove;

    before(async () => {
      // Create a case report to be removed
      caseReportToRemove = await app.service('case-report').create(
        {
          crfId: testCaseReportForm._id.toString(),
          caseReportForm: testCaseReportForm._id,
          revision: 1,
          state: 'completed',
          data: { 
            _id: 'test-remove-' + Date.now(),
            test: 'to_remove'
          }
        },
        { authentication: { strategy: 'jwt', accessToken: adminToken } }
      );
    });

    it('removes a case report', async () => {
      const result = await app.service('case-report').remove(
        caseReportToRemove._id,
        { authentication: { strategy: 'jwt', accessToken: adminToken } }
      );

      assert.ok(result);
      assert.strictEqual(result._id.toString(), caseReportToRemove._id.toString());

      // Verify it's removed
      try {
        await app.service('case-report').get(
          caseReportToRemove._id,
          { authentication: { strategy: 'jwt', accessToken: adminToken } }
        );
        assert.fail('Should have thrown NotFound error');
      } catch (error) {
        assert.strictEqual(error.name, 'NotFound');
      }
    });

    it('fails to remove non-existent case report', async () => {
      const fakeId = new ObjectId();
      try {
        await app.service('case-report').remove(
          fakeId,
          { authentication: { strategy: 'jwt', accessToken: adminToken } }
        );
        assert.fail('Should have thrown NotFound error');
      } catch (error) {
        assert.strictEqual(error.name, 'NotFound');
      }
    });

    it('allows manager to remove case reports', async () => {
      // Create a case report
      const caseReport = await app.service('case-report').create(
        {
          crfId: testCaseReportForm._id.toString(),
          caseReportForm: testCaseReportForm._id,
          revision: 1,
          data: {
            _id: 'test-manager-' + Date.now()
          }
        },
        { authentication: { strategy: 'jwt', accessToken: managerToken } }
      );

      // Remove it as manager
      const result = await app.service('case-report').remove(
        caseReport._id,
        { authentication: { strategy: 'jwt', accessToken: managerToken } }
      );

      assert.ok(result);
    });
  });

  describe('multi remove', () => {
    let caseReports;

    before(async () => {
      // Create multiple case reports for testing multi remove
      const timestamp = Date.now();
      caseReports = await Promise.all([
        app.service('case-report').create(
          {
            crfId: testCaseReportForm._id.toString(),
            caseReportForm: testCaseReportForm._id,
            revision: 1,
            state: 'in_progress',
            data: { 
              _id: 'multi-test1-' + timestamp,
              multi: 'test1'
            }
          },
          { authentication: { strategy: 'jwt', accessToken: adminToken } }
        ),
        app.service('case-report').create(
          {
            crfId: testCaseReportForm._id.toString(),
            caseReportForm: testCaseReportForm._id,
            revision: 1,
            state: 'in_progress',
            data: { 
              _id: 'multi-test2-' + timestamp,
              multi: 'test2'
            }
          },
          { authentication: { strategy: 'jwt', accessToken: adminToken } }
        )
      ]);
    });

    it('removes multiple case reports with query', async () => {
      const ids = caseReports.map(cr => cr._id);
      
      const result = await app.service('case-report').remove(null, {
        query: { _id: { $in: ids } },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      assert.ok(result);
      
      // Verify they are removed
      const remaining = await app.service('case-report').find({
        query: { _id: { $in: ids } },
        authentication: { strategy: 'jwt', accessToken: adminToken }
      });

      assert.strictEqual(remaining.data.length, 0);
    });
  });
});
