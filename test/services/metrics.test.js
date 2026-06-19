const assert = require('assert');
const appPromise = require('../../src/app');
let app;
const { Metrics } = require('../../src/services/metrics/metrics.class');
const { BadRequest } = require('@feathersjs/errors');
const { ObjectId } = require('mongodb');

before(async function() { this.timeout(30000); app = await appPromise; });

describe('\'metrics\' service', () => {
  let service;
  let mockApp;
  let mockServices;

  beforeEach(() => {
    // Create mock aggregation result
    const createMockAggregate = (results) => ({
      toArray: async () => results
    });

    // Create mock services
    mockServices = {
      user: {
        find: async () => ({ total: 10, data: [] }),
        Model: {
          aggregate: () => createMockAggregate([])
        }
      },
      group: {
        find: async () => ({ total: 5, data: [] }),
        Model: {
          aggregate: () => createMockAggregate([])
        }
      },
      study: {
        find: async () => ({ total: 3, data: [] }),
        Model: {
          aggregate: () => createMockAggregate([])
        }
      },
      form: {
        find: async () => ({ total: 15, data: [] }),
        Model: {
          aggregate: () => createMockAggregate([])
        }
      },
      'case-report-form': {
        find: async () => ({ total: 8, data: [] }),
        Model: {
          aggregate: () => createMockAggregate([])
        }
      },
      'case-report': {
        find: async () => ({ total: 100, data: [] }),
        Model: {
          aggregate: () => createMockAggregate([
            { _id: { year: 2024, month: 1, day: 15 }, count: 10 },
            { _id: { year: 2024, month: 1, day: 16 }, count: 15 }
          ])
        }
      },
      'interview-design': {
        find: async () => ({ total: 12, data: [] }),
        Model: {
          aggregate: () => createMockAggregate([])
        }
      },
      interview: {
        find: async () => ({ total: 250, data: [] }),
        Model: {
          aggregate: () => createMockAggregate([
            { _id: { year: 2024, month: 2, day: 1 }, count: 20 },
            { _id: { year: 2024, month: 2, day: 2 }, count: 25 }
          ])
        }
      },
      participant: {
        find: async () => ({ total: 50, data: [] }),
        Model: {
          aggregate: () => createMockAggregate([
            { _id: true, count: 40 },
            { _id: false, count: 10 }
          ])
        }
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

    service = new Metrics({ paginate: { max: 1000 } }, mockApp);
  });

  describe('service registration', () => {
    it('registered the service', () => {
      const registeredService = app.service('metrics');
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
      const serviceWithoutOptions = new Metrics(null, mockApp);
      assert.ok(serviceWithoutOptions.options);
      assert.deepStrictEqual(serviceWithoutOptions.options, {});
    });
  });

  describe('getCollection', () => {
    it('should get Model from service', async () => {
      const collection = await service.getCollection('user');
      assert.ok(collection);
      assert.strictEqual(collection, mockServices.user.Model);
    });

    it('should handle services with getModel method', async () => {
      let getModelCalled = false;
      mockServices.user.getModel = async () => {
        getModelCalled = true;
        return mockServices.user.Model;
      };

      await service.getCollection('user');
      assert.strictEqual(getModelCalled, true);
    });

    it('should work without getModel method', async () => {
      delete mockServices.user.getModel;
      const collection = await service.getCollection('user');
      assert.ok(collection);
    });
  });

  describe('aggregate', () => {
    it('should run aggregation pipeline', async () => {
      const pipeline = [{ $match: { state: 'active' } }];
      const result = await service.aggregate('case-report', pipeline);

      assert.ok(Array.isArray(result));
      assert.strictEqual(result.length, 2);
    });

    it('should return results from toArray', async () => {
      const result = await service.aggregate('case-report', []);
      assert.ok(Array.isArray(result));
      assert.ok(result[0]._id);
      assert.ok(result[0].count);
    });
  });

  describe('makeCountQuery', () => {
    it('should create basic count query', () => {
      const params = { query: {} };
      const result = service.makeCountQuery(params, 'user');

      assert.ok(result.query);
      assert.strictEqual(result.query.$limit, 0);
    });

    it('should merge entity-specific query parameters', () => {
      const params = {
        query: {
          user: {
            role: 'administrator',
            activated: true
          }
        }
      };

      const result = service.makeCountQuery(params, 'user');

      assert.strictEqual(result.query.role, 'administrator');
      assert.strictEqual(result.query.activated, true);
      assert.strictEqual(result.query.$limit, 0);
    });

    it('should handle empty params', () => {
      const params = {};
      const result = service.makeCountQuery(params, 'user');

      assert.ok(result.query);
      assert.strictEqual(result.query.$limit, 0);
    });

    it('should override any existing $limit', () => {
      const params = {
        query: {
          user: {
            $limit: 100
          }
        }
      };

      const result = service.makeCountQuery(params, 'user');
      assert.strictEqual(result.query.$limit, 0);
    });
  });

  describe('makeTimeAggregationQuery', () => {
    it('should create time-based aggregation pipeline', () => {
      const params = { query: {} };
      const pipeline = service.makeTimeAggregationQuery(params, 'case-report');

      assert.ok(Array.isArray(pipeline));
      assert.strictEqual(pipeline.length, 2);
      assert.ok(pipeline[0].$group);
      assert.ok(pipeline[1].$sort);
    });

    it('should group by year, month, and day', () => {
      const params = { query: {} };
      const pipeline = service.makeTimeAggregationQuery(params, 'case-report');

      const groupStage = pipeline[0].$group;
      assert.ok(groupStage._id.year);
      assert.ok(groupStage._id.month);
      assert.ok(groupStage._id.day);
      assert.deepStrictEqual(groupStage.count, { $sum: 1 });
    });

    it('should sort by date ascending', () => {
      const params = { query: {} };
      const pipeline = service.makeTimeAggregationQuery(params, 'case-report');

      const sortStage = pipeline[1].$sort;
      assert.strictEqual(sortStage['_id.year'], 1);
      assert.strictEqual(sortStage['_id.month'], 1);
      assert.strictEqual(sortStage['_id.day'], 1);
    });

    it('should add match stage for entity filters', () => {
      const params = {
        query: {
          'case-report': {
            study: '507f1f77bcf86cd799439011'
          }
        }
      };

      const pipeline = service.makeTimeAggregationQuery(params, 'case-report');

      assert.strictEqual(pipeline.length, 3);
      assert.ok(pipeline[0].$match);
    });
  });

  describe('makeStatusAggregationQuery', () => {
    it('should create status aggregation pipeline', () => {
      const params = { query: {} };
      const pipeline = service.makeStatusAggregationQuery(params, 'interview', 'state');

      assert.ok(Array.isArray(pipeline));
      assert.strictEqual(pipeline.length, 1);
      assert.ok(pipeline[0].$group);
    });

    it('should group by specified field', () => {
      const params = { query: {} };
      const pipeline = service.makeStatusAggregationQuery(params, 'interview', 'state');

      const groupStage = pipeline[0].$group;
      assert.strictEqual(groupStage._id, '$state');
      assert.deepStrictEqual(groupStage.count, { $sum: 1 });
    });

    it('should add match stage for entity filters', () => {
      const params = {
        query: {
          interview: {
            campaign: '507f1f77bcf86cd799439011'
          }
        }
      };

      const pipeline = service.makeStatusAggregationQuery(params, 'interview', 'state');

      assert.strictEqual(pipeline.length, 2);
      assert.ok(pipeline[0].$match);
    });
  });

  describe('toMongoQuery', () => {
    it('should convert hex string IDs to ObjectId', () => {
      const query = {
        study: '507f1f77bcf86cd799439011'
      };

      const result = service.toMongoQuery(query);

      assert.ok(result.study instanceof ObjectId);
      assert.strictEqual(result.study.toString(), '507f1f77bcf86cd799439011');
    });

    it('should convert multiple entity IDs', () => {
      const query = {
        study: '507f1f77bcf86cd799439011',
        form: '507f1f77bcf86cd799439012',
        campaign: '507f1f77bcf86cd799439013'
      };

      const result = service.toMongoQuery(query);

      assert.ok(result.study instanceof ObjectId);
      assert.ok(result.form instanceof ObjectId);
      assert.ok(result.campaign instanceof ObjectId);
    });

    it('should handle caseReportForm field', () => {
      const query = {
        caseReportForm: '507f1f77bcf86cd799439011'
      };

      const result = service.toMongoQuery(query);
      assert.ok(result.caseReportForm instanceof ObjectId);
    });

    it('should handle interviewDesign field', () => {
      const query = {
        interviewDesign: '507f1f77bcf86cd799439011'
      };

      const result = service.toMongoQuery(query);
      assert.ok(result.interviewDesign instanceof ObjectId);
    });

    it('should leave non-entity fields unchanged', () => {
      const query = {
        study: '507f1f77bcf86cd799439011',
        activated: true,
        name: 'Test Study'
      };

      const result = service.toMongoQuery(query);

      assert.ok(result.study instanceof ObjectId);
      assert.strictEqual(result.activated, true);
      assert.strictEqual(result.name, 'Test Study');
    });

    it('should not mutate source query and should be idempotent across calls', () => {
      const query = {
        interviewDesign: '507f1f77bcf86cd799439011',
        campaign: '507f1f77bcf86cd799439012'
      };

      const result1 = service.toMongoQuery(query);
      const result2 = service.toMongoQuery(result1);

      assert.strictEqual(typeof query.interviewDesign, 'string');
      assert.strictEqual(typeof query.campaign, 'string');
      assert.ok(result1.interviewDesign instanceof ObjectId);
      assert.ok(result1.campaign instanceof ObjectId);
      assert.ok(result2.interviewDesign instanceof ObjectId);
      assert.ok(result2.campaign instanceof ObjectId);
    });
  });

  describe('find', () => {
    it('should return counts for all entities', async () => {
      const result = await service.find({ query: {} });

      assert.ok(result.counts);
      assert.strictEqual(result.counts.users, 10);
      assert.strictEqual(result.counts.groups, 5);
      assert.strictEqual(result.counts.studies, 3);
      assert.strictEqual(result.counts.forms, 15);
      assert.strictEqual(result.counts.case_report_forms, 8);
      assert.strictEqual(result.counts.case_reports, 100);
      assert.strictEqual(result.counts.interview_designs, 12);
      assert.strictEqual(result.counts.interviews, 250);
    });

    it('should include aggregated time data', async () => {
      const result = await service.find({ query: {} });

      assert.ok(Array.isArray(result.counts.case_reports_agg));
      assert.ok(Array.isArray(result.counts.interviews_agg));
      assert.strictEqual(result.counts.case_reports_agg.length, 2);
      assert.strictEqual(result.counts.interviews_agg.length, 2);
    });

    it('should handle entity-specific filters', async () => {
      let userQuery = null;
      mockServices.user.find = async (params) => {
        userQuery = params.query;
        return { total: 5, data: [] };
      };

      const params = {
        query: {
          user: {
            role: 'administrator'
          }
        }
      };

      const result = await service.find(params);

      assert.strictEqual(userQuery.role, 'administrator');
      assert.strictEqual(result.counts.users, 5);
    });

    it('should call all services in parallel', async () => {
      const callOrder = [];
      
      mockServices.user.find = async () => {
        callOrder.push('user');
        return { total: 10, data: [] };
      };
      
      mockServices.group.find = async () => {
        callOrder.push('group');
        return { total: 5, data: [] };
      };

      await service.find({ query: {} });

      assert.ok(callOrder.length > 0);
    });
  });

  describe('get - study metrics', () => {
    it('should return study-specific metrics', async () => {
      const result = await service.get('study', { query: {} });

      assert.ok(result.counts);
      assert.strictEqual(result.counts.forms, 15);
      assert.strictEqual(result.counts.case_report_forms, 8);
      assert.strictEqual(result.counts.case_reports, 100);
      assert.strictEqual(result.counts.interview_designs, 12);
      assert.strictEqual(result.counts.interviews, 250);
    });

    it('should include aggregated data for study', async () => {
      const result = await service.get('study', { query: {} });

      assert.ok(Array.isArray(result.counts.case_reports_agg));
      assert.ok(Array.isArray(result.counts.interviews_agg));
    });

    it('should apply study-specific filters', async () => {
      let formQuery = null;
      mockServices.form.find = async (params) => {
        formQuery = params.query;
        return { total: 3, data: [] };
      };

      const params = {
        query: {
          form: {
            study: '507f1f77bcf86cd799439011'
          }
        }
      };

      const result = await service.get('study', params);

      assert.ok(formQuery);
      assert.strictEqual(result.counts.forms, 3);
    });
  });

  describe('get - case-report metrics', () => {
    it('should return case-report metrics', async () => {
      const result = await service.get('case-report', { query: {} });

      assert.ok(result.counts);
      assert.ok(result.counts.case_reports);
      assert.ok(Array.isArray(result.counts.case_reports_agg));
    });

    it('should include full pagination data', async () => {
      mockServices['case-report'].find = async () => ({
        total: 100,
        limit: 10,
        skip: 0,
        data: []
      });

      const result = await service.get('case-report', { query: {} });

      assert.strictEqual(result.counts.case_reports.total, 100);
    });
  });

  describe('get - interview metrics', () => {
    it('should return interview metrics', async () => {
      const result = await service.get('interview', { query: {} });

      assert.ok(result.counts);
      assert.ok(result.counts.interviews);
      assert.ok(Array.isArray(result.counts.interviews_agg));
      assert.ok(Array.isArray(result.counts.interviews_freq));
      assert.ok(Array.isArray(result.counts.participants_freq));
    });

    it('should include state frequency distribution', async () => {
      mockServices.interview.Model.aggregate = () => ({
        toArray: async () => [
          { _id: 'completed', count: 150 },
          { _id: 'in_progress', count: 80 },
          { _id: 'paused', count: 20 }
        ]
      });

      const result = await service.get('interview', { query: {} });

      assert.ok(Array.isArray(result.counts.interviews_freq));
      assert.strictEqual(result.counts.interviews_freq.length, 3);
    });

    it('should include participant activation frequency', async () => {
      const result = await service.get('interview', { query: {} });

      assert.ok(Array.isArray(result.counts.participants_freq));
      assert.strictEqual(result.counts.participants_freq.length, 2);
      assert.strictEqual(result.counts.participants_freq[0]._id, true);
      assert.strictEqual(result.counts.participants_freq[0].count, 40);
    });
  });

  describe('get - generic entity metrics', () => {
    it('should return metrics for any entity', async () => {
      const result = await service.get('user', { query: {} });

      assert.ok(result.counts);
      assert.ok(result.counts.user);
    });

    it('should pass through entity query parameters', async () => {
      let queryReceived = null;
      mockServices.form.find = async (params) => {
        queryReceived = params.query;
        return { total: 5, data: [] };
      };

      const params = {
        query: {
          form: {
            study: '507f1f77bcf86cd799439011',
            state: 'active'
          }
        }
      };

      await service.get('form', params);

      assert.ok(queryReceived);
      assert.strictEqual(queryReceived.$limit, 0);
    });
  });

  describe('unimplemented methods', () => {
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
      const realService = app.service('metrics');
      assert.ok(realService);
    });
  });
});
