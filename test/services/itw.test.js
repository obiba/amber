const assert = require('assert');
const app = require('../../src/app');
const { Itw } = require('../../src/services/itw/itw.class');
const { BadRequest } = require('@feathersjs/errors');
const { ItwBase } = require('../../src/utils/itw');

describe('\'itw\' service', () => {
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
            supporters: ['user3']
          }]
        })
      },
      'interview-design': {
        find: async () => ({
          total: 1,
          data: [{
            _id: 'itwd1',
            name: 'Test Interview',
            state: 'active',
            study: 'study1',
            steps: [
              {
                name: 'step1',
                form: 'form1',
                revision: 1
              },
              {
                name: 'step2',
                form: 'form2',
                revision: 1
              }
            ]
          }]
        })
      },
      interview: {
        find: async (params) => {
          if (params.query && params.query.code === 'P001') {
            return {
              total: 1,
              data: [{
                _id: 'int1',
                code: 'P001',
                identifier: 'ID001',
                participant: 'p1',
                campaign: 'camp1',
                interviewDesign: 'itwd1',
                study: 'study1',
                state: 'in_progress',
                data: {},
                steps: [
                  {
                    name: 'step1',
                    form: 'form1',
                    revision: 1,
                    state: 'completed',
                    actions: [],
                    data: { field1: 'value1' }
                  }
                ]
              }]
            };
          }
          return { total: 0, data: [] };
        },
        create: async (data) => ({
          _id: 'int_new',
          ...data,
          steps: data.steps || [],
          data: data.data || {}
        }),
        _patch: async (id, data) => ({
          _id: id,
          code: 'P001',
          identifier: 'ID001',
          participant: 'p1',
          campaign: 'camp1',
          interviewDesign: 'itwd1',
          study: 'study1',
          data: {},
          ...data,
          steps: data.steps || []
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

    service = new Itw({ paginate: { max: 1000 } }, mockApp);
  });

  describe('service registration', () => {
    it('registered the service', () => {
      const registeredService = app.service('itw');
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
      assert.ok(service instanceof ItwBase);
      assert.ok(service.extractInterviewInfo);
      assert.strictEqual(typeof service.extractInterviewInfo, 'function');
    });

    it('should have pagination options', () => {
      assert.ok(service.options.paginate);
      assert.strictEqual(service.options.paginate.max, 1000);
    });
  });

  describe('find', () => {
    it('should return existing interview when found', async () => {
      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          activated: true,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
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
      assert.strictEqual(result.data[0].code, 'P001');
      assert.strictEqual(result.data[0].state, 'in_progress');
    });

    it('should create new interview when not found', async () => {
      mockServices.interview.find = async () => ({ total: 0, data: [] });

      const params = {
        participant: {
          _id: 'p1',
          code: 'P002',
          identifier: 'ID002',
          activated: true,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        },
        query: {}
      };

      const result = await service.find(params);

      assert.ok(result);
      assert.strictEqual(result.total, 1);
      assert.ok(result.data[0]);
      assert.strictEqual(result.data[0].code, 'P002');
      assert.strictEqual(result.data[0].state, 'initiated');
    });

    it('should return paginated result structure', async () => {
      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          activated: true,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        },
        query: {}
      };

      const result = await service.find(params);

      assert.strictEqual(result.limit, 1);
      assert.strictEqual(result.skip, 0);
      assert.strictEqual(result.total, 1);
      assert.ok(Array.isArray(result.data));
    });

    it('should digest interview data properly', async () => {
      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          activated: true,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        },
        query: {}
      };

      const result = await service.find(params);
      const interview = result.data[0];

      assert.ok(interview._id);
      assert.ok(interview.code);
      assert.ok(interview.identifier);
      assert.ok(interview.state);
      assert.ok(Array.isArray(interview.steps));
      // digestInterview should only include specific fields
      assert.strictEqual(interview.steps[0].name, 'step1');
      assert.strictEqual(interview.steps[0].state, 'completed');
      assert.ok(interview.steps[0].data);
    });
  });

  describe('patch', () => {
    it('should update interview steps', async () => {
      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          activated: true,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        },
        user: {
          _id: 'user1',
          role: 'interviewer'
        },
        query: {}
      };

      const data = {
        steps: [
          {
            name: 'step2',
            form: 'form2',
            revision: 1,
            state: 'completed',
            data: { field2: 'value2' }
          }
        ]
      };

      const result = await service.patch('int1', data, params);

      assert.ok(result);
      assert.ok(result.steps);
      assert.ok(result.steps.some(s => s.name === 'step2'));
    });

    it('should add new step to interview', async () => {
      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          activated: true,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        },
        user: {
          _id: 'user1',
          role: 'interviewer'
        },
        query: {}
      };

      const data = {
        steps: [
          {
            name: 'step3',
            form: 'form3',
            revision: 1,
            state: 'in_progress',
            data: { field3: 'value3' }
          }
        ]
      };

      const result = await service.patch('int1', data, params);

      assert.ok(result);
      assert.ok(result.steps);
    });

    it('should add action to new step', async () => {
      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          activated: true,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        },
        user: {
          _id: 'user1',
          role: 'interviewer'
        },
        query: {}
      };

      const data = {
        steps: [
          {
            name: 'step2',
            form: 'form2',
            revision: 1,
            state: 'completed',
            data: { field2: 'value2' }
          }
        ]
      };

      mockServices.interview._patch = async (id, patchData) => {
        const step = patchData.steps.find(s => s.name === 'step2');
        assert.ok(step.actions);
        assert.ok(step.actions.length > 0);
        assert.strictEqual(step.actions[0].type, 'complete');
        assert.strictEqual(step.actions[0].user, 'user1');
        assert.ok(step.actions[0].timestamp);

        return {
          _id: id,
          code: 'P001',
          identifier: 'ID001',
          participant: 'p1',
          campaign: 'camp1',
          interviewDesign: 'itwd1',
          study: 'study1',
          data: {},
          ...patchData
        };
      };

      await service.patch('int1', data, params);
    });

    it('should remove step when state is null', async () => {
      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          activated: true,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        },
        user: {
          _id: 'user1',
          role: 'interviewer'
        },
        query: {}
      };

      const data = {
        steps: [
          {
            name: 'step1',
            state: null
          }
        ]
      };

      mockServices.interview._patch = async (id, patchData) => {
        assert.ok(patchData.steps);
        assert.ok(!patchData.steps.some(s => s.name === 'step1'));

        return {
          _id: id,
          code: 'P001',
          identifier: 'ID001',
          participant: 'p1',
          campaign: 'camp1',
          interviewDesign: 'itwd1',
          study: 'study1',
          data: {},
          steps: []
        };
      };

      await service.patch('int1', data, params);
    });

    it('should set interview state to completed when all steps completed', async () => {
      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          activated: true,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        },
        user: {
          _id: 'user1',
          role: 'interviewer'
        },
        query: {}
      };

      mockServices.interview.find = async () => ({
        total: 1,
        data: [{
          _id: 'int1',
          code: 'P001',
          identifier: 'ID001',
          participant: 'p1',
          campaign: 'camp1',
          interviewDesign: 'itwd1',
          study: 'study1',
          state: 'in_progress',
          data: {},
          steps: [
            {
              name: 'step1',
              form: 'form1',
              revision: 1,
              state: 'completed',
              actions: [],
              data: { field1: 'value1' }
            }
          ]
        }]
      });

      const data = {
        steps: [
          {
            name: 'step2',
            form: 'form2',
            revision: 1,
            state: 'completed',
            data: { field2: 'value2' }
          }
        ]
      };

      mockServices.interview._patch = async (id, patchData) => {
        assert.strictEqual(patchData.state, 'completed');

        return {
          _id: id,
          code: 'P001',
          identifier: 'ID001',
          participant: 'p1',
          campaign: 'camp1',
          interviewDesign: 'itwd1',
          study: 'study1',
          data: {},
          ...patchData
        };
      };

      await service.patch('int1', data, params);
    });

    it('should set interview state to in_progress when steps incomplete', async () => {
      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          activated: true,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        },
        user: {
          _id: 'user1',
          role: 'interviewer'
        },
        query: {}
      };

      const data = {
        steps: [
          {
            name: 'step1',
            form: 'form1',
            revision: 1,
            state: 'in_progress',
            data: { field1: 'value1' }
          }
        ]
      };

      mockServices.interview._patch = async (id, patchData) => {
        assert.strictEqual(patchData.state, 'in_progress');

        return {
          _id: id,
          code: 'P001',
          identifier: 'ID001',
          participant: 'p1',
          campaign: 'camp1',
          interviewDesign: 'itwd1',
          study: 'study1',
          data: {},
          ...patchData
        };
      };

      await service.patch('int1', data, params);
    });

    it('should allow forcing interview state', async () => {
      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          activated: true,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        },
        user: {
          _id: 'user1',
          role: 'interviewer'
        },
        query: {}
      };

      const data = {
        state: 'cancelled',
        steps: []
      };

      mockServices.interview._patch = async (id, patchData) => {
        assert.strictEqual(patchData.state, 'cancelled');

        return {
          _id: id,
          code: 'P001',
          identifier: 'ID001',
          participant: 'p1',
          campaign: 'camp1',
          interviewDesign: 'itwd1',
          study: 'study1',
          data: {},
          ...patchData
        };
      };

      await service.patch('int1', data, params);
    });

    it('should handle pause action for steps with data', async () => {
      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          activated: true,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        },
        user: {
          _id: 'user1',
          role: 'interviewer'
        },
        query: {}
      };

      const data = {
        steps: [
          {
            name: 'step2',
            form: 'form2',
            revision: 1,
            state: 'in_progress',
            data: { field2: 'partial' }
          }
        ]
      };

      mockServices.interview._patch = async (id, patchData) => {
        const step = patchData.steps.find(s => s.name === 'step2');
        assert.strictEqual(step.actions[0].type, 'pause');

        return {
          _id: id,
          code: 'P001',
          identifier: 'ID001',
          participant: 'p1',
          campaign: 'camp1',
          interviewDesign: 'itwd1',
          study: 'study1',
          data: {},
          ...patchData
        };
      };

      await service.patch('int1', data, params);
    });
  });

  describe('update', () => {
    it('should return data as-is', async () => {
      const data = { test: 'value' };
      const result = await service.update('id', data, {});
      assert.deepStrictEqual(result, data);
    });

    it('should handle empty data', async () => {
      const data = {};
      const result = await service.update('id', data, {});
      assert.deepStrictEqual(result, data);
    });
  });

  describe('unimplemented methods', () => {
    it('should throw BadRequest for get', async () => {
      try {
        await service.get('id', {});
        assert.fail('Should have thrown BadRequest');
      } catch (error) {
        assert.ok(error instanceof BadRequest);
        assert.strictEqual(error.message, 'Not implemented');
      }
    });

    it('should throw BadRequest for create', async () => {
      try {
        await service.create({}, {});
        assert.fail('Should have thrown BadRequest');
      } catch (error) {
        assert.ok(error instanceof BadRequest);
        assert.strictEqual(error.message, 'Not implemented');
      }
    });

    it('should throw BadRequest for remove', async () => {
      try {
        await service.remove('id', {});
        assert.fail('Should have thrown BadRequest');
      } catch (error) {
        assert.ok(error instanceof BadRequest);
        assert.strictEqual(error.message, 'Not implemented');
      }
    });
  });

  describe('getOrCreateInterview', () => {
    it('should return existing interview when found', async () => {
      const params = {
        participant: {
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          activated: true,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        },
        query: {}
      };

      const result = await service.getOrCreateInterview(params);

      assert.ok(result.interview);
      assert.ok(result.interviewDesign);
      assert.strictEqual(result.interview.code, 'P001');
      assert.strictEqual(result.interviewDesign._id, 'itwd1');
    });

    it('should create new interview when not found', async () => {
      mockServices.interview.find = async () => ({ total: 0, data: [] });

      const params = {
        participant: {
          _id: 'p1',
          code: 'P002',
          identifier: 'ID002',
          activated: true,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        },
        query: {}
      };

      const result = await service.getOrCreateInterview(params);

      assert.ok(result.interview);
      assert.ok(result.interviewDesign);
      assert.strictEqual(result.interview.code, 'P002');
      assert.strictEqual(result.interview.state, 'initiated');
      assert.ok(Array.isArray(result.interview.steps));
    });

    it('should include all required fields in created interview', async () => {
      mockServices.interview.find = async () => ({ total: 0, data: [] });

      const params = {
        participant: {
          _id: 'p1',
          code: 'P003',
          identifier: 'ID003',
          activated: true,
          campaign: 'camp1',
          interviewDesign: 'itwd1'
        },
        query: {}
      };

      mockServices.interview.create = async (data) => {
        assert.strictEqual(data.code, 'P003');
        assert.strictEqual(data.identifier, 'ID003');
        assert.strictEqual(data.participant, 'p1');
        assert.strictEqual(data.campaign, 'camp1');
        assert.strictEqual(data.interviewDesign, 'itwd1');
        assert.strictEqual(data.study, 'study1');
        assert.strictEqual(data.state, 'initiated');
        assert.ok(Array.isArray(data.steps));

        return {
          _id: 'int_new',
          ...data
        };
      };

      await service.getOrCreateInterview(params);
    });
  });

  describe('digestInterview', () => {
    it('should return only specific fields', () => {
      const interview = {
        _id: 'int1',
        code: 'P001',
        identifier: 'ID001',
        data: { some: 'data' },
        interviewDesign: 'itwd1',
        state: 'completed',
        fillingDate: new Date(),
        participant: 'p1',
        campaign: 'camp1',
        createdAt: new Date(),
        updatedAt: new Date(),
        steps: [
          {
            name: 'step1',
            form: 'form1',
            revision: 1,
            state: 'completed',
            actions: [{ type: 'complete', user: 'user1', timestamp: new Date() }],
            data: { field1: 'value1' }
          }
        ]
      };

      const result = service.digestInterview(interview);

      assert.ok(result._id);
      assert.ok(result.code);
      assert.ok(result.identifier);
      assert.ok(result.data);
      assert.ok(result.interviewDesign);
      assert.ok(result.state);
      assert.ok(result.fillingDate);
      assert.ok(result.steps);
      // Should NOT include these fields
      assert.strictEqual(result.participant, undefined);
      assert.strictEqual(result.campaign, undefined);
      assert.strictEqual(result.createdAt, undefined);
      assert.strictEqual(result.updatedAt, undefined);
    });

    it('should filter step fields', () => {
      const interview = {
        _id: 'int1',
        code: 'P001',
        identifier: 'ID001',
        data: {},
        interviewDesign: 'itwd1',
        state: 'in_progress',
        steps: [
          {
            name: 'step1',
            form: 'form1',
            revision: 1,
            state: 'completed',
            actions: [{ type: 'complete' }],
            data: { field1: 'value1' }
          }
        ]
      };

      const result = service.digestInterview(interview);

      assert.strictEqual(result.steps.length, 1);
      assert.strictEqual(result.steps[0].name, 'step1');
      assert.strictEqual(result.steps[0].state, 'completed');
      assert.ok(result.steps[0].data);
      // Should NOT include form, revision, actions in digest
      assert.strictEqual(result.steps[0].form, undefined);
      assert.strictEqual(result.steps[0].revision, undefined);
      assert.strictEqual(result.steps[0].actions, undefined);
    });

    it('should handle empty steps array', () => {
      const interview = {
        _id: 'int1',
        code: 'P001',
        identifier: 'ID001',
        data: {},
        interviewDesign: 'itwd1',
        state: 'initiated',
        steps: []
      };

      const result = service.digestInterview(interview);

      assert.ok(Array.isArray(result.steps));
      assert.strictEqual(result.steps.length, 0);
    });

    it('should handle multiple steps', () => {
      const interview = {
        _id: 'int1',
        code: 'P001',
        identifier: 'ID001',
        data: {},
        interviewDesign: 'itwd1',
        state: 'in_progress',
        steps: [
          {
            name: 'step1',
            state: 'completed',
            data: { q1: 'answer1' }
          },
          {
            name: 'step2',
            state: 'in_progress',
            data: { q2: 'answer2' }
          },
          {
            name: 'step3',
            state: 'not_started',
            data: {}
          }
        ]
      };

      const result = service.digestInterview(interview);

      assert.strictEqual(result.steps.length, 3);
      assert.strictEqual(result.steps[0].name, 'step1');
      assert.strictEqual(result.steps[1].name, 'step2');
      assert.strictEqual(result.steps[2].name, 'step3');
    });
  });

  describe('integration with real app', () => {
    it('should work with real app instance', () => {
      const realService = app.service('itw');
      assert.ok(realService);
      assert.ok(realService.find);
      assert.ok(realService.patch);
      assert.ok(realService.update);
    });
  });
});
