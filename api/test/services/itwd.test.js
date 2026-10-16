const assert = require('assert');
const appPromise = require('../../src/app');
let app;
const { Itwd } = require('../../src/services/itwd/itwd.class');
const { BadRequest, Forbidden } = require('@feathersjs/errors');

before(async function() { this.timeout(30000); app = await appPromise; });

describe('\'itwd\' service', () => {
  let service;
  let mockApp;
  let mockServices;

  beforeEach(() => {
    // Create mock services
    mockServices = {
      participant: {
        find: async () => ({
          total: 1,
          data: [{
            _id: 'p1',
            code: 'P001',
            identifier: 'ID001',
            activated: true,
            validFrom: new Date(Date.now() - 1000 * 60 * 60 * 24), // yesterday
            validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days from now
            campaign: 'camp1',
            interviewDesign: 'itwd1',
            data: { age: 30 }
          }]
        })
      },
      campaign: {
        find: async () => ({
          total: 1,
          data: [{
            _id: 'camp1',
            investigators: ['user1', 'user2'],
            supporters: ['user3'],
            completionUrl: 'https://example.com/complete'
          }]
        })
      },
      'interview-design': {
        find: async () => ({
          total: 1,
          data: [{
            _id: 'itwd1',
            name: 'Test Interview',
            label: 'Test Interview Label',
            description: 'Test Description',
            interviewer_instructions: 'Instructions for interviewer',
            participant_instructions: 'Instructions for participant',
            state: 'active',
            steps: [
              {
                _id: 'step1',
                name: 'step1',
                label: 'Step 1',
                description: 'First step',
                time_estimate: 10,
                time_estimate_max: 15,
                form: 'form1',
                revision: 1
              },
              {
                _id: 'step2',
                name: 'step2',
                label: 'Step 2',
                description: 'Second step',
                time_estimate: 20,
                form: 'form2'
              }
            ],
            i18n: {
              en: { title: 'Interview' },
              fr: { title: 'Entrevue' }
            }
          }]
        })
      },
      'form-revision': {
        find: async (query) => ({
          total: 1,
          data: [{
            form: query.query.form,
            revision: query.query.revision || 1,
            schema: {
              items: [
                { name: 'field1', type: 'text', label: 'Field 1' },
                { name: 'field2', type: 'number', label: 'Field 2' }
              ]
            }
          }]
        })
      },
      user: {
        find: async () => ({
          total: 1,
          data: [{
            _id: 'user3',
            firstname: 'John',
            lastname: 'Doe',
            email: 'john.doe@example.com',
            phone: '123-456-7890',
            institution: 'Test University',
            city: 'Test City'
          }]
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

    service = new Itwd({ paginate: { max: 1000 } }, mockApp);
  });

  describe('service registration', () => {
    it('registered the service', () => {
      const registeredService = app.service('itwd');
      assert.ok(registeredService, 'Registered the service');
    });
  });

  describe('constructor', () => {
    it('should initialize with options and app', () => {
      assert.ok(service.app);
      assert.ok(service.options);
      assert.strictEqual(service.app, mockApp);
    });

    it('should inherit from ItwBase', () => {
      assert.ok(service.extractInterviewInfo);
      assert.strictEqual(typeof service.extractInterviewInfo, 'function');
    });
  });

  describe('find', () => {
    it('should return interview design digest for participant', async () => {
      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          campaign: 'camp1',
          interviewDesign: 'itwd1',
          data: { age: 30 }
        },
        query: {}
      };

      const result = await service.find(params);

      assert.ok(result);
      assert.strictEqual(result.total, 1);
      assert.strictEqual(result.limit, 1);
      assert.strictEqual(result.skip, 0);
      assert.ok(Array.isArray(result.data));
      assert.strictEqual(result.data.length, 1);
    });

    it('should include participant data in response', async () => {
      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          campaign: 'camp1',
          interviewDesign: 'itwd1',
          data: { age: 30, gender: 'M' }
        },
        query: {}
      };

      const result = await service.find(params);

      assert.strictEqual(result.data[0].participant._id, 'p1');
      assert.strictEqual(result.data[0].participant.code, 'P001');
      assert.strictEqual(result.data[0].participant.identifier, 'ID001');
      assert.deepStrictEqual(result.data[0].participant.data, { age: 30, gender: 'M' });
    });

    it('should include supporters information', async () => {
      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          campaign: 'camp1',
          interviewDesign: 'itwd1',
          data: {}
        },
        query: {}
      };

      const result = await service.find(params);

      assert.ok(result.data[0].supporters);
      assert.ok(Array.isArray(result.data[0].supporters));
      assert.strictEqual(result.data[0].supporters[0].firstname, 'John');
      assert.strictEqual(result.data[0].supporters[0].email, 'john.doe@example.com');
    });

    it('should include interview design metadata', async () => {
      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          campaign: 'camp1',
          interviewDesign: 'itwd1',
          data: {}
        },
        query: {}
      };

      const result = await service.find(params);

      assert.strictEqual(result.data[0]._id, 'itwd1');
      assert.strictEqual(result.data[0].name, 'Test Interview');
      assert.strictEqual(result.data[0].label, 'Test Interview Label');
      assert.strictEqual(result.data[0].description, 'Test Description');
      assert.strictEqual(result.data[0].interviewer_instructions, 'Instructions for interviewer');
      assert.strictEqual(result.data[0].participant_instructions, 'Instructions for participant');
    });

    it('should include completion URL from campaign', async () => {
      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          campaign: 'camp1',
          interviewDesign: 'itwd1',
          data: {}
        },
        query: {}
      };

      const result = await service.find(params);

      assert.strictEqual(result.data[0].completionUrl, 'https://example.com/complete');
    });

    it('should include i18n information', async () => {
      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          campaign: 'camp1',
          interviewDesign: 'itwd1',
          data: {}
        },
        query: {}
      };

      const result = await service.find(params);

      assert.ok(result.data[0].i18n);
      assert.strictEqual(result.data[0].i18n.en.title, 'Interview');
      assert.strictEqual(result.data[0].i18n.fr.title, 'Entrevue');
    });

    it('should include steps with form schemas', async () => {
      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          campaign: 'camp1',
          interviewDesign: 'itwd1',
          data: {}
        },
        query: {}
      };

      const result = await service.find(params);

      assert.ok(result.data[0].steps);
      assert.ok(Array.isArray(result.data[0].steps));
      assert.strictEqual(result.data[0].steps.length, 2);
      assert.strictEqual(result.data[0].steps[0].name, 'step1');
      assert.strictEqual(result.data[0].steps[0].label, 'Step 1');
      assert.ok(result.data[0].steps[0].schema);
    });

    it('should include step metadata', async () => {
      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          campaign: 'camp1',
          interviewDesign: 'itwd1',
          data: {}
        },
        query: {}
      };

      const result = await service.find(params);

      const step1 = result.data[0].steps[0];
      assert.strictEqual(step1._id, 'step1');
      assert.strictEqual(step1.name, 'step1');
      assert.strictEqual(step1.label, 'Step 1');
      assert.strictEqual(step1.description, 'First step');
      assert.strictEqual(step1.time_estimate, 10);
      assert.strictEqual(step1.time_estimate_max, 15);
    });

    it('should use specific revision when provided', async () => {
      let requestedRevisions = [];
      mockServices['form-revision'].find = async (query) => {
        requestedRevisions.push(query.query.revision);
        return {
          total: 1,
          data: [{
            form: query.query.form,
            revision: query.query.revision || 1,
            schema: { items: [] }
          }]
        };
      };

      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          campaign: 'camp1',
          interviewDesign: 'itwd1',
          data: {}
        },
        query: {}
      };

      await service.find(params);

      // First step has revision 1, second step has no revision (undefined)
      assert.strictEqual(requestedRevisions[0], 1);
      assert.strictEqual(requestedRevisions[1], undefined);
    });

    it('should query latest revision when not specified', async () => {
      mockServices['interview-design'].find = async () => ({
        total: 1,
        data: [{
          _id: 'itwd1',
          name: 'Test Interview',
          state: 'active',
          steps: [{
            _id: 'step1',
            name: 'step1',
            form: 'form1'
            // no revision specified
          }]
        }]
      });

      let queryParams = null;
      mockServices['form-revision'].find = async (query) => {
        queryParams = query.query;
        return {
          total: 1,
          data: [{
            form: query.query.form,
            revision: 3,
            schema: { items: [] }
          }]
        };
      };

      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          campaign: 'camp1',
          interviewDesign: 'itwd1',
          data: {}
        },
        query: {}
      };

      await service.find(params);

      assert.strictEqual(queryParams.$limit, 1);
      assert.deepStrictEqual(queryParams.$sort, { revision: -1 });
      assert.ok(!queryParams.revision);
    });

    it('should skip steps with no form revision found', async () => {
      mockServices['interview-design'].find = async () => ({
        total: 1,
        data: [{
          _id: 'itwd1',
          name: 'Test Interview',
          state: 'active',
          steps: [
            {
              _id: 'step1',
              name: 'step1',
              form: 'form1'
            },
            {
              _id: 'step2',
              name: 'step2',
              form: 'invalid-form'
            }
          ]
        }]
      });

      mockServices['form-revision'].find = async (query) => {
        if (query.query.form === 'invalid-form') {
          return { total: 0, data: [] };
        }
        return {
          total: 1,
          data: [{
            form: query.query.form,
            revision: 1,
            schema: { items: [] }
          }]
        };
      };

      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          campaign: 'camp1',
          interviewDesign: 'itwd1',
          data: {}
        },
        query: {}
      };

      const result = await service.find(params);

      // Only step1 should be included
      assert.strictEqual(result.data[0].steps.length, 1);
      assert.strictEqual(result.data[0].steps[0].name, 'step1');
    });

    it('should handle multiple supporters', async () => {
      mockServices.user.find = async () => ({
        total: 3,
        data: [
          {
            _id: 'user1',
            firstname: 'John',
            lastname: 'Doe',
            email: 'john@example.com'
          },
          {
            _id: 'user2',
            firstname: 'Jane',
            lastname: 'Smith',
            email: 'jane@example.com'
          },
          {
            _id: 'user3',
            firstname: 'Bob',
            lastname: 'Johnson',
            email: 'bob@example.com'
          }
        ]
      });

      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          campaign: 'camp1',
          interviewDesign: 'itwd1',
          data: {}
        },
        query: {}
      };

      const result = await service.find(params);

      assert.strictEqual(result.data[0].supporters.length, 3);
      assert.strictEqual(result.data[0].supporters[0].firstname, 'John');
      assert.strictEqual(result.data[0].supporters[1].firstname, 'Jane');
      assert.strictEqual(result.data[0].supporters[2].firstname, 'Bob');
    });
  });

  describe('extractInterviewInfo - authorization', () => {
    it('should reject non-interviewer users', async () => {
      const params = {
        user: { _id: 'user1', role: 'participant' },
        query: { code: 'P001' }
      };

      try {
        await service.extractInterviewInfo(params);
        assert.fail('Should have thrown Forbidden');
      } catch (err) {
        assert.ok(err instanceof Forbidden);
        assert.strictEqual(err.message, 'You are not an interviewer');
      }
    });

    it('should allow interviewer role', async () => {
      mockServices.participant.find = async () => ({
        total: 1,
        data: [{
          _id: 'p1',
          code: 'P001',
          activated: true,
          validFrom: null,
          validUntil: null,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        }]
      });

      const params = {
        user: { _id: 'user1', role: 'interviewer' },
        query: { code: 'P001' }
      };

      const result = await service.extractInterviewInfo(params);

      assert.ok(result.participant);
      assert.ok(result.campaign);
      assert.ok(result.interviewDesign);
    });

    it('should allow manager role', async () => {
      mockServices.participant.find = async () => ({
        total: 1,
        data: [{
          _id: 'p1',
          code: 'P001',
          activated: true,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        }]
      });

      const params = {
        user: { _id: 'user1', role: 'manager' },
        query: { code: 'P001' }
      };

      const result = await service.extractInterviewInfo(params);

      assert.ok(result.participant);
    });

    it('should allow administrator role', async () => {
      mockServices.participant.find = async () => ({
        total: 1,
        data: [{
          _id: 'p1',
          code: 'P001',
          activated: true,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        }]
      });

      const params = {
        user: { _id: 'user1', role: 'administrator' },
        query: { code: 'P001' }
      };

      const result = await service.extractInterviewInfo(params);

      assert.ok(result.participant);
    });

    it('should reject interviewer not in investigators or supporters', async () => {
      mockServices.participant.find = async () => ({
        total: 1,
        data: [{
          _id: 'p1',
          code: 'P001',
          activated: true,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        }]
      });

      mockServices.campaign.find = async () => ({
        total: 1,
        data: [{
          _id: 'camp1',
          investigators: ['user1', 'user2'],
          supporters: ['user3']
        }]
      });

      const params = {
        user: { _id: 'user99', role: 'interviewer' },
        query: { code: 'P001' }
      };

      try {
        await service.extractInterviewInfo(params);
        assert.fail('Should have thrown Forbidden');
      } catch (err) {
        assert.ok(err instanceof Forbidden);
        assert.strictEqual(err.message, 'You are not an investigator');
      }
    });
  });

  describe('extractInterviewInfo - participant validation', () => {
    it('should throw error if participant code is missing', async () => {
      const params = {
        user: { _id: 'user1', role: 'interviewer' },
        query: {}
      };

      try {
        await service.extractInterviewInfo(params);
        assert.fail('Should have thrown BadRequest');
      } catch (err) {
        assert.ok(err instanceof BadRequest);
        assert.strictEqual(err.message, 'Participant code is missing');
      }
    });

    it('should throw error if participant not found', async () => {
      mockServices.participant.find = async () => ({
        total: 0,
        data: []
      });

      const params = {
        user: { _id: 'user1', role: 'interviewer' },
        query: { code: 'INVALID' }
      };

      try {
        await service.extractInterviewInfo(params);
        assert.fail('Should have thrown BadRequest');
      } catch (err) {
        assert.ok(err instanceof BadRequest);
        assert.strictEqual(err.message, 'Participant not found');
      }
    });

    it('should throw error if participant is not activated', async () => {
      mockServices.participant.find = async () => ({
        total: 1,
        data: [{
          _id: 'p1',
          code: 'P001',
          activated: false,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        }]
      });

      const params = {
        user: { _id: 'user1', role: 'interviewer' },
        query: { code: 'P001' }
      };

      try {
        await service.extractInterviewInfo(params);
        assert.fail('Should have thrown BadRequest');
      } catch (err) {
        assert.ok(err instanceof BadRequest);
        assert.strictEqual(err.message, 'Not a valid participant code');
      }
    });

    it('should throw error if participant validFrom is in the future', async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // tomorrow

      mockServices.participant.find = async () => ({
        total: 1,
        data: [{
          _id: 'p1',
          code: 'P001',
          activated: true,
          validFrom: futureDate,
          validUntil: null,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        }]
      });

      const params = {
        user: { _id: 'user1', role: 'interviewer' },
        query: { code: 'P001' }
      };

      try {
        await service.extractInterviewInfo(params);
        assert.fail('Should have thrown BadRequest');
      } catch (err) {
        assert.ok(err instanceof BadRequest);
        assert.strictEqual(err.message, 'Not a valid participant code');
      }
    });

    it('should throw error if participant validUntil has passed', async () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24); // yesterday

      mockServices.participant.find = async () => ({
        total: 1,
        data: [{
          _id: 'p1',
          code: 'P001',
          activated: true,
          validFrom: null,
          validUntil: pastDate,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        }]
      });

      const params = {
        user: { _id: 'user1', role: 'interviewer' },
        query: { code: 'P001' }
      };

      try {
        await service.extractInterviewInfo(params);
        assert.fail('Should have thrown BadRequest');
      } catch (err) {
        assert.ok(err instanceof BadRequest);
        assert.strictEqual(err.message, 'Not a valid participant code');
      }
    });

    it('should throw error if interview design is not active', async () => {
      mockServices.participant.find = async () => ({
        total: 1,
        data: [{
          _id: 'p1',
          code: 'P001',
          activated: true,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        }]
      });

      mockServices['interview-design'].find = async () => ({
        total: 0,
        data: []
      });

      const params = {
        user: { _id: 'user1', role: 'interviewer' },
        query: { code: 'P001' }
      };

      try {
        await service.extractInterviewInfo(params);
        assert.fail('Should have thrown BadRequest');
      } catch (err) {
        assert.ok(err instanceof BadRequest);
        assert.strictEqual(err.message, 'Interview design is not active');
      }
    });

    it('should accept participant from params directly', async () => {
      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          activated: true,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        },
        query: {}
      };

      const result = await service.extractInterviewInfo(params);

      assert.ok(result.participant);
      assert.strictEqual(result.participant._id, 'p1');
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
      const realService = app.service('itwd');
      assert.ok(realService);
    });
  });
});
