const assert = require('assert');
const app = require('../../src/app');
const { CaseReportExport } = require('../../src/services/case-report-export/case-report-export.class');
const { BadRequest } = require('@feathersjs/errors');

describe('\'case-report-export\' service', () => {
  let service;
  let mockApp;
  let mockServices;

  beforeEach(() => {
    // Create mock services
    mockServices = {
      'case-report': {
        find: async () => ({ data: [], total: 0 })
      },
      'case-report-form': {
        get: async (id) => ({
          _id: id,
          name: 'Test Case Report Form',
          repeatPolicy: 'single'
        })
      },
      'form-revision': {
        find: async () => ({
          total: 1,
          data: [{
            form: 'form1',
            revision: 1,
            schema: {
              items: [
                { name: 'field1', type: 'text' },
                { name: 'field2', type: 'number' }
              ],
              i18n: {
                en: { field1: 'Field 1', field2: 'Field 2' }
              }
            }
          }]
        })
      },
      form: {
        get: async (id) => ({
          _id: id,
          name: 'Test Form',
          schema: {
            items: [
              { name: 'field1', type: 'text' }
            ]
          }
        })
      }
    };

    // Create mock app
    mockApp = {
      service: (name) => mockServices[name],
      get: (key) => {
        const config = {
          paginate: { max: 1000 },
          export: {
            entity_type: 'CaseReport',
            identifier_variable: 'id'
          }
        };
        return config[key];
      }
    };

    service = new CaseReportExport({ paginate: { max: 1000 } }, mockApp);
  });

  describe('service registration', () => {
    it('registered the service', () => {
      const registeredService = app.service('case-report-export');
      assert.ok(registeredService, 'Registered the service');
    });
  });

  describe('constructor', () => {
    it('should initialize with options and app', () => {
      assert.ok(service.app);
      assert.ok(service.options);
      assert.strictEqual(service.app, mockApp);
    });

    it('should initialize caseReportForms cache', () => {
      assert.ok(service.caseReportForms);
      assert.strictEqual(typeof service.caseReportForms, 'object');
      assert.deepStrictEqual(service.caseReportForms, {});
    });

    it('should inherit from FormDataExport', () => {
      assert.ok(service.initExport);
      assert.ok(service.parseInteger);
      assert.ok(service.flattenByItems);
    });
  });

  describe('find', () => {
    it('should return export result structure', async () => {
      mockServices['case-report'].find = async () => ({
        total: 0,
        data: []
      });

      const result = await service.find({ query: { $skip: 0, $limit: 10 } });

      assert.ok(result);
      assert.strictEqual(typeof result.export, 'object');
      assert.strictEqual(result.total, 0);
      assert.strictEqual(result.found, 0);
      assert.strictEqual(result.skip, 0);
      assert.strictEqual(result.limit, 10);
    });

    it('should handle case reports with data', async () => {
      mockServices['case-report'].find = async () => ({
        total: 1,
        data: [{
          _id: 'cr1',
          caseReportForm: 'crf1',
          form: 'form1',
          revision: 1,
          data: {
            _id: 'cr1',
            field1: 'value1',
            field2: 42
          }
        }]
      });

      const result = await service.find({ query: { $skip: 0, $limit: 10 } });

      assert.strictEqual(result.found, 1);
      assert.strictEqual(result.total, 1);
      assert.ok(Object.keys(result.export).length > 0);
    });

    it('should parse skip and limit from query', async () => {
      const result = await service.find({ 
        query: { $skip: '10', $limit: '20' } 
      });

      assert.strictEqual(result.skip, 10);
      assert.strictEqual(result.limit, 20);
    });

    it('should handle exponential notation for skip and limit', async () => {
      const result = await service.find({ 
        query: { $skip: '1e2', $limit: '1e3' } 
      });

      assert.strictEqual(result.skip, 100);
      assert.strictEqual(result.limit, 1000);
    });

    it('should split large limits into smaller chunks', async () => {
      let callCount = 0;
      mockServices['case-report'].find = async (params) => {
        callCount++;
        assert.ok(params.query.$limit <= 500);
        return {
          total: 1200,
          data: [{
            _id: 'cr' + callCount,
            caseReportForm: 'crf1',
            form: 'form1',
            revision: 1,
            data: { _id: 'cr' + callCount, field1: 'value' }
          }]
        };
      };

      await service.find({ query: { $skip: 0, $limit: 1200 } });

      // 1200 / 500 = 2.4, so should be called 3 times (500 + 500 + 200)
      assert.strictEqual(callCount, 3);
    });

    it('should break loop when no more results', async () => {
      let callCount = 0;
      mockServices['case-report'].find = async () => {
        callCount++;
        return { total: 0, data: [] };
      };

      await service.find({ query: { $skip: 0, $limit: 1000 } });

      assert.strictEqual(callCount, 1);
    });

    it('should cache case report forms', async () => {
      let getCallCount = 0;
      mockServices['case-report-form'].get = async (id) => {
        getCallCount++;
        return {
          _id: id,
          name: 'Test CRF',
          repeatPolicy: 'single'
        };
      };

      mockServices['case-report'].find = async () => ({
        total: 2,
        data: [
          {
            _id: 'cr1',
            caseReportForm: 'crf1',
            form: 'form1',
            revision: 1,
            data: { _id: 'cr1', field1: 'value1' }
          },
          {
            _id: 'cr2',
            caseReportForm: 'crf1',
            form: 'form1',
            revision: 1,
            data: { _id: 'cr2', field1: 'value2' }
          }
        ]
      });

      await service.find({ query: { $skip: 0, $limit: 10 } });

      // Should only be called once due to caching
      assert.strictEqual(getCallCount, 1);
    });

    it('should handle case reports without caseReportForm field', async () => {
      mockServices['case-report'].find = async () => ({
        total: 1,
        data: [{
          _id: 'cr1',
          caseReportForm: undefined,
          form: 'form1',
          revision: 1,
          data: { _id: 'cr1', field1: 'value1' }
        }]
      });

      const result = await service.find({ query: { $skip: 0, $limit: 10 } });

      assert.strictEqual(result.found, 1);
      assert.ok(Object.keys(result.export).length > 0);
    });

    it('should handle multiple repeatPolicy', async () => {
      mockServices['case-report-form'].get = async (id) => ({
        _id: id,
        name: 'Repeatable CRF',
        repeatPolicy: 'multiple'
      });

      mockServices['case-report'].find = async () => ({
        total: 1,
        data: [{
          _id: 'cr1',
          caseReportForm: 'crf1',
          form: 'form1',
          revision: 1,
          data: { _id: 'cr1', field1: 'value1' }
        }]
      });

      const result = await service.find({ query: { $skip: 0, $limit: 10 } });

      assert.strictEqual(result.found, 1);
    });

    it('should group case reports by form and revision', async () => {
      mockServices['case-report'].find = async () => ({
        total: 3,
        data: [
          {
            _id: 'cr1',
            caseReportForm: 'crf1',
            form: 'form1',
            revision: 1,
            data: { _id: 'cr1', field1: 'value1' }
          },
          {
            _id: 'cr2',
            caseReportForm: 'crf1',
            form: 'form1',
            revision: 1,
            data: { _id: 'cr2', field1: 'value2' }
          },
          {
            _id: 'cr3',
            caseReportForm: 'crf1',
            form: 'form1',
            revision: 2,
            data: { _id: 'cr3', field1: 'value3' }
          }
        ]
      });

      const result = await service.find({ query: { $skip: 0, $limit: 10 } });

      assert.strictEqual(result.found, 3);
      // Should have 2 groups: form1-1 and form1-2
      assert.ok(Object.keys(result.export).length >= 1);
    });

    it('should update skip parameter for pagination', async () => {
      let skipValues = [];
      mockServices['case-report'].find = async (params) => {
        skipValues.push(params.query.$skip);
        if (skipValues.length === 1) {
          return {
            total: 1000,
            data: [{
              _id: 'cr1',
              caseReportForm: 'crf1',
              form: 'form1',
              revision: 1,
              data: { _id: 'cr1', field1: 'value1' }
            }]
          };
        }
        return { total: 1000, data: [] };
      };

      await service.find({ query: { $skip: 0, $limit: 600 } });

      // First call with 0, second with 500
      assert.strictEqual(skipValues[0], 0);
      assert.strictEqual(skipValues[1], 500);
    });
  });

  describe('getCaseReportForm', () => {
    it('should fetch case report form from service', async () => {
      const crf = await service.getCaseReportForm('crf123');

      assert.ok(crf);
      assert.strictEqual(crf._id, 'crf123');
      assert.strictEqual(crf.name, 'Test Case Report Form');
    });

    it('should cache fetched case report forms', async () => {
      await service.getCaseReportForm('crf123');
      const crf2 = await service.getCaseReportForm('crf123');

      assert.ok(service.caseReportForms['crf123']);
      assert.strictEqual(crf2._id, 'crf123');
    });

    it('should not make duplicate requests for same form', async () => {
      let callCount = 0;
      mockServices['case-report-form'].get = async (id) => {
        callCount++;
        return { _id: id, name: 'CRF', repeatPolicy: 'single' };
      };

      await service.getCaseReportForm('crf1');
      await service.getCaseReportForm('crf1');
      await service.getCaseReportForm('crf1');

      assert.strictEqual(callCount, 1);
    });

    it('should handle different forms separately', async () => {
      const crf1 = await service.getCaseReportForm('crf1');
      const crf2 = await service.getCaseReportForm('crf2');

      assert.strictEqual(crf1._id, 'crf1');
      assert.strictEqual(crf2._id, 'crf2');
      assert.ok(service.caseReportForms['crf1']);
      assert.ok(service.caseReportForms['crf2']);
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

  describe('data processing', () => {
    it('should handle complex nested data', async () => {
      mockServices['case-report'].find = async () => ({
        total: 1,
        data: [{
          _id: 'cr1',
          caseReportForm: 'crf1',
          form: 'form1',
          revision: 1,
          data: {
            _id: 'cr1',
            demographics: {
              age: 30,
              gender: 'M'
            },
            measurements: [10, 20, 30]
          }
        }]
      });

      mockServices['form-revision'].find = async () => ({
        total: 1,
        data: [{
          form: 'form1',
          revision: 1,
          schema: {
            items: [
              {
                name: 'demographics',
                type: 'group',
                items: [
                  { name: 'age', type: 'number' },
                  { name: 'gender', type: 'select' }
                ]
              },
              { name: 'measurements', type: 'number', multiple: true }
            ]
          }
        }]
      });

      const result = await service.find({ query: { $skip: 0, $limit: 10 } });

      assert.strictEqual(result.found, 1);
      assert.ok(Object.keys(result.export).length > 0);
    });

    it('should handle empty data field', async () => {
      mockServices['case-report'].find = async () => ({
        total: 1,
        data: [{
          _id: 'cr1',
          caseReportForm: 'crf1',
          form: 'form1',
          revision: 1,
          data: { _id: 'cr1' }
        }]
      });

      const result = await service.find({ query: { $skip: 0, $limit: 10 } });

      assert.strictEqual(result.found, 1);
    });

    it('should handle case reports with different revisions', async () => {
      mockServices['case-report'].find = async () => ({
        total: 2,
        data: [
          {
            _id: 'cr1',
            caseReportForm: 'crf1',
            form: 'form1',
            revision: 1,
            data: { _id: 'cr1', field1: 'value1' }
          },
          {
            _id: 'cr2',
            caseReportForm: 'crf1',
            form: 'form1',
            revision: 2,
            data: { _id: 'cr2', field1: 'value2', field3: 'new' }
          }
        ]
      });

      const result = await service.find({ query: { $skip: 0, $limit: 10 } });

      assert.strictEqual(result.found, 2);
    });
  });

  describe('edge cases', () => {
    it('should handle null case report form ID', async () => {
      mockServices['case-report'].find = async () => ({
        total: 1,
        data: [{
          _id: 'cr1',
          caseReportForm: null,
          form: 'form1',
          revision: 1,
          data: { _id: 'cr1', field1: 'value1' }
        }]
      });

      const result = await service.find({ query: { $skip: 0, $limit: 10 } });

      assert.strictEqual(result.found, 1);
    });

    it('should handle case reports with special characters', async () => {
      mockServices['case-report'].find = async () => ({
        total: 1,
        data: [{
          _id: 'cr1',
          caseReportForm: 'crf1',
          form: 'form1',
          revision: 1,
          data: {
            _id: 'cr1',
            notes: 'Special chars: é, ñ, ü, 中文, 日本語',
            symbols: '!@#$%^&*()'
          }
        }]
      });

      const result = await service.find({ query: { $skip: 0, $limit: 10 } });

      assert.strictEqual(result.found, 1);
    });

    it('should handle large datasets', async () => {
      const caseReports = [];
      for (let i = 1; i <= 50; i++) {
        caseReports.push({
          _id: `cr${i}`,
          caseReportForm: 'crf1',
          form: 'form1',
          revision: 1,
          data: {
            _id: `cr${i}`,
            field1: `value${i}`,
            sequence: i
          }
        });
      }

      mockServices['case-report'].find = async () => ({
        total: 50,
        data: caseReports
      });

      const result = await service.find({ query: { $skip: 0, $limit: 100 } });

      assert.strictEqual(result.found, 50);
      assert.strictEqual(result.total, 50);
    });

    it('should handle empty result set', async () => {
      mockServices['case-report'].find = async () => ({
        total: 0,
        data: []
      });

      const result = await service.find({ query: { $skip: 0, $limit: 10 } });

      assert.strictEqual(result.found, 0);
      assert.strictEqual(result.total, 0);
      assert.deepStrictEqual(result.export, {});
    });
  });

  describe('inherited methods from FormDataExport', () => {
    it('should have parseInteger method', () => {
      assert.strictEqual(typeof service.parseInteger, 'function');
      assert.strictEqual(service.parseInteger('123'), 123);
      assert.strictEqual(service.parseInteger('1e2'), 100);
    });

    it('should have initExport method', () => {
      assert.strictEqual(typeof service.initExport, 'function');
      const exportData = service.initExport();
      assert.ok(exportData.exportResults);
      assert.ok(exportData.forms);
      assert.ok(exportData.formRevisions);
    });

    it('should have flattenByItems method', () => {
      assert.strictEqual(typeof service.flattenByItems, 'function');
      const items = [
        { name: 'field1', type: 'text' }
      ];
      const data = { field1: 'value1' };
      const result = service.flattenByItems(items, data);
      assert.strictEqual(result.field1, 'value1');
    });

    it('should have marshallValue method', () => {
      assert.strictEqual(typeof service.marshallValue, 'function');
      assert.strictEqual(service.marshallValue('text'), 'text');
      assert.strictEqual(service.marshallValue(123), 123);
    });

    it('should have makeVariables method', () => {
      assert.strictEqual(typeof service.makeVariables, 'function');
      const item = { name: 'field1', type: 'text' };
      const options = { entityType: 'CaseReport', i18n: null };
      const variable = service.makeVariables(item, options);
      assert.strictEqual(variable.name, 'field1');
    });
  });

  describe('integration with real app', () => {
    it('should work with real app instance', () => {
      const realService = app.service('case-report-export');
      assert.ok(realService);
    });
  });
});
