const assert = require('assert');
const app = require('../../src/app');
const { InterviewExport } = require('../../src/services/interview-export/interview-export.class');
const { BadRequest } = require('@feathersjs/errors');

describe('\'interview-export\' service', () => {
  let service;
  let mockApp;
  let mockServices;

  beforeEach(() => {
    // Create mock services
    mockServices = {
      interview: {
        find: async () => ({ data: [], total: 0 })
      },
      'interview-design': {
        get: async (id) => ({
          _id: id,
          name: 'Test Interview Design',
          state: 'active'
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
            entity_type: 'Participant',
            identifier_variable: 'id'
          }
        };
        return config[key];
      }
    };

    service = new InterviewExport({ paginate: { max: 1000 } }, mockApp);
  });

  describe('service registration', () => {
    it('registered the service', () => {
      const registeredService = app.service('interview-export');
      assert.ok(registeredService, 'Registered the service');
    });
  });

  describe('constructor', () => {
    it('should initialize with options and app', () => {
      assert.ok(service.app);
      assert.ok(service.options);
      assert.strictEqual(typeof service.interviewDesigns, 'object');
    });

    it('should initialize interviewDesigns cache as empty object', () => {
      assert.deepStrictEqual(service.interviewDesigns, {});
    });
  });

  describe('find', () => {
    it('should return export result structure', async () => {
      mockServices.interview.find = async () => ({
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

    it('should handle interviews with steps', async () => {
      mockServices.interview.find = async () => ({
        total: 1,
        data: [{
          _id: 'itw1',
          code: 'ITW001',
          identifier: 'ID001',
          interviewDesign: 'itwd1',
          steps: [{
            name: 'step1',
            form: 'form1',
            revision: 1,
            data: {
              field1: 'value1',
              field2: 42
            }
          }]
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
      mockServices.interview.find = async (params) => {
        callCount++;
        assert.ok(params.query.$limit <= 500);
        // Return data to prevent early loop break
        return {
          total: 1200,
          data: [{
            _id: 'itw' + callCount,
            code: 'ITW' + callCount,
            interviewDesign: 'itwd1',
            steps: [{ name: 'step1', form: 'form1', revision: 1, data: {} }]
          }]
        };
      };

      await service.find({ query: { $skip: 0, $limit: 1200 } });

      // 1200 / 500 = 2.4, so should be called 3 times (500 + 500 + 200)
      assert.strictEqual(callCount, 3);
    });

    it('should break loop when no more results', async () => {
      let callCount = 0;
      mockServices.interview.find = async () => {
        callCount++;
        return { total: 0, data: [] };
      };

      await service.find({ query: { $skip: 0, $limit: 1000 } });

      assert.strictEqual(callCount, 1);
    });

    it('should cache interview designs', async () => {
      let getCallCount = 0;
      mockServices['interview-design'].get = async (id) => {
        getCallCount++;
        return {
          _id: id,
          name: 'Test Design'
        };
      };

      mockServices.interview.find = async () => ({
        total: 2,
        data: [
          {
            _id: 'itw1',
            code: 'ITW001',
            interviewDesign: 'itwd1',
            steps: [{ name: 'step1', form: 'form1', revision: 1, data: {} }]
          },
          {
            _id: 'itw2',
            code: 'ITW002',
            interviewDesign: 'itwd1',
            steps: [{ name: 'step1', form: 'form1', revision: 1, data: {} }]
          }
        ]
      });

      await service.find({ query: { $skip: 0, $limit: 10 } });

      // Should only be called once due to caching
      assert.strictEqual(getCallCount, 1);
    });
  });

  describe('getInterviewDesign', () => {
    it('should fetch interview design from service', async () => {
      const design = await service.getInterviewDesign('itwd123');

      assert.ok(design);
      assert.strictEqual(design._id, 'itwd123');
      assert.strictEqual(design.name, 'Test Interview Design');
    });

    it('should cache fetched interview designs', async () => {
      await service.getInterviewDesign('itwd123');
      const design2 = await service.getInterviewDesign('itwd123');

      assert.ok(service.interviewDesigns['itwd123']);
      assert.strictEqual(design2._id, 'itwd123');
    });

    it('should not make duplicate requests for same design', async () => {
      let callCount = 0;
      mockServices['interview-design'].get = async (id) => {
        callCount++;
        return { _id: id, name: 'Design' };
      };

      await service.getInterviewDesign('itwd1');
      await service.getInterviewDesign('itwd1');
      await service.getInterviewDesign('itwd1');

      assert.strictEqual(callCount, 1);
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

  describe('parseInteger', () => {
    it('should parse regular integer strings', () => {
      assert.strictEqual(service.parseInteger('123'), 123);
      assert.strictEqual(service.parseInteger('0'), 0);
      assert.strictEqual(service.parseInteger('999'), 999);
    });

    it('should parse exponential notation', () => {
      assert.strictEqual(service.parseInteger('1e2'), 100);
      assert.strictEqual(service.parseInteger('1e3'), 1000);
      assert.strictEqual(service.parseInteger('5e2'), 500);
    });

    it('should parse negative exponential notation', () => {
      assert.strictEqual(service.parseInteger('1e-2'), 0);
      assert.strictEqual(service.parseInteger('100e-1'), 10);
    });

    it('should parse numbers directly', () => {
      assert.strictEqual(service.parseInteger(123), 123);
      assert.strictEqual(service.parseInteger(0), 0);
    });

    it('should return NaN for invalid input', () => {
      assert.ok(isNaN(service.parseInteger('abc')));
      assert.ok(isNaN(service.parseInteger('1ea')));
    });

    it('should handle case insensitive exponential notation', () => {
      assert.strictEqual(service.parseInteger('1E2'), 100);
      assert.strictEqual(service.parseInteger('1E+3'), 1000);
    });
  });

  describe('initExport', () => {
    it('should return export structure', () => {
      const exportData = service.initExport();

      assert.ok(exportData);
      assert.ok(exportData.exportResults);
      assert.ok(exportData.forms);
      assert.ok(exportData.formRevisions);
      assert.strictEqual(typeof exportData.exportResults, 'object');
      assert.strictEqual(typeof exportData.forms, 'object');
      assert.strictEqual(typeof exportData.formRevisions, 'object');
    });

    it('should initialize with empty objects', () => {
      const exportData = service.initExport();

      assert.strictEqual(Object.keys(exportData.exportResults).length, 0);
      assert.strictEqual(Object.keys(exportData.forms).length, 0);
      assert.strictEqual(Object.keys(exportData.formRevisions).length, 0);
    });
  });

  describe('flattenByItems', () => {
    it('should flatten simple data', () => {
      const items = [
        { name: 'field1', type: 'text' },
        { name: 'field2', type: 'number' }
      ];
      const data = {
        _id: '123',
        field1: 'value1',
        field2: 42
      };

      const result = service.flattenByItems(items, data);

      assert.strictEqual(result._id, '123');
      assert.strictEqual(result.field1, 'value1');
      assert.strictEqual(result.field2, 42);
    });

    it('should skip section items', () => {
      const items = [
        { name: 'section1', type: 'section' },
        { name: 'field1', type: 'text' }
      ];
      const data = {
        field1: 'value1'
      };

      const result = service.flattenByItems(items, data);

      assert.ok(!result.section1);
      assert.strictEqual(result.field1, 'value1');
    });

    it('should flatten nested group items', () => {
      const items = [
        {
          name: 'group1',
          type: 'group',
          items: [
            { name: 'field1', type: 'text' },
            { name: 'field2', type: 'number' }
          ]
        }
      ];
      const data = {
        group1: {
          field1: 'value1',
          field2: 42
        }
      };

      const result = service.flattenByItems(items, data);

      assert.strictEqual(result['group1.field1'], 'value1');
      assert.strictEqual(result['group1.field2'], 42);
    });

    it('should handle null or undefined data', () => {
      const items = [
        { name: 'field1', type: 'text' }
      ];

      const result1 = service.flattenByItems(items, null);
      const result2 = service.flattenByItems(items, undefined);

      assert.ok(result1);
      assert.ok(result2);
    });
  });

  describe('marshallValue', () => {
    it('should return primitive values as is', () => {
      assert.strictEqual(service.marshallValue('text'), 'text');
      assert.strictEqual(service.marshallValue(123), 123);
      assert.strictEqual(service.marshallValue(true), true);
      assert.strictEqual(service.marshallValue(null), null);
    });

    it('should convert GeoJSON Feature to coordinates string', () => {
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [12.34, 56.78]
        }
      };

      const result = service.marshallValue(geojson);

      assert.strictEqual(result, JSON.stringify([12.34, 56.78]));
    });

    it('should marshall array values recursively', () => {
      const array = [
        'value1',
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [1, 2]
          }
        }
      ];

      const result = service.marshallValue(array);

      assert.ok(Array.isArray(result));
      assert.strictEqual(result[0], 'value1');
      assert.strictEqual(result[1], JSON.stringify([1, 2]));
    });

    it('should handle regular objects', () => {
      const obj = { key: 'value' };
      const result = service.marshallValue(obj);
      assert.deepStrictEqual(result, obj);
    });
  });

  describe('makeVariables', () => {
    it('should create variable for text field', () => {
      const item = {
        name: 'textField',
        type: 'text',
        label: 'Text Field'
      };
      const options = {
        entityType: 'Participant',
        i18n: { en: { 'Text Field': 'Text Field' } }
      };

      const variable = service.makeVariables(item, options);

      assert.strictEqual(variable.name, 'textField');
      assert.strictEqual(variable.valueType, 'text');
      assert.strictEqual(variable.entityType, 'Participant');
    });

    it('should create variable for number field', () => {
      const item = {
        name: 'numberField',
        type: 'number'
      };
      const options = {
        entityType: 'Participant',
        i18n: null
      };

      const variable = service.makeVariables(item, options);

      assert.strictEqual(variable.name, 'numberField');
      assert.strictEqual(variable.valueType, 'integer');
    });

    it('should create variable for toggle field', () => {
      const item = {
        name: 'toggleField',
        type: 'toggle'
      };
      const options = {
        entityType: 'Participant',
        i18n: null
      };

      const variable = service.makeVariables(item, options);

      assert.strictEqual(variable.valueType, 'boolean');
    });

    it('should create variable for date field', () => {
      const item = {
        name: 'dateField',
        type: 'date'
      };
      const options = {
        entityType: 'Participant',
        i18n: null
      };

      const variable = service.makeVariables(item, options);

      assert.strictEqual(variable.valueType, 'date');
    });

    it('should handle fields with options (categories)', () => {
      const item = {
        name: 'selectField',
        type: 'select',
        options: [
          { value: 'opt1', label: 'Option 1' },
          { value: 'opt2', label: 'Option 2' }
        ]
      };
      const options = {
        entityType: 'Participant',
        i18n: { en: { 'Option 1': 'Option 1', 'Option 2': 'Option 2' } }
      };

      const variable = service.makeVariables(item, options);

      assert.ok(variable.categories);
      assert.strictEqual(variable.categories.length, 2);
      assert.strictEqual(variable.categories[0].name, 'opt1');
      assert.strictEqual(variable.categories[1].name, 'opt2');
    });

    it('should mark multiple fields as repeatable', () => {
      const item = {
        name: 'multiField',
        type: 'text',
        multiple: true
      };
      const options = {
        entityType: 'Participant',
        i18n: null
      };

      const variable = service.makeVariables(item, options);

      assert.strictEqual(variable.isRepeatable, true);
    });

    it('should handle nested group items', () => {
      const item = {
        name: 'group',
        type: 'group',
        items: [
          { name: 'field1', type: 'text' },
          { name: 'field2', type: 'number' }
        ]
      };
      const options = {
        entityType: 'Participant',
        i18n: null
      };

      const variables = service.makeVariables(item, options);

      assert.ok(Array.isArray(variables));
      assert.strictEqual(variables.length, 2);
      assert.strictEqual(variables[0].name, 'group.field1');
      assert.strictEqual(variables[1].name, 'group.field2');
    });

    it('should skip section items in groups', () => {
      const item = {
        name: 'group',
        type: 'group',
        items: [
          { name: 'section', type: 'section' },
          { name: 'field1', type: 'text' }
        ]
      };
      const options = {
        entityType: 'Participant',
        i18n: null
      };

      const variables = service.makeVariables(item, options);

      assert.strictEqual(variables.length, 1);
      assert.strictEqual(variables[0].name, 'group.field1');
    });

    it('should return empty array for section items', () => {
      const item = {
        name: 'section',
        type: 'section'
      };
      const options = {
        entityType: 'Participant',
        i18n: null
      };

      const result = service.makeVariables(item, options);

      assert.ok(Array.isArray(result));
      assert.strictEqual(result.length, 0);
    });
  });

  describe('makeAttributes', () => {
    it('should create attributes with i18n', () => {
      const key = 'label';
      const i18n = {
        en: { label: 'English Label' },
        fr: { label: 'French Label' }
      };

      const attrs = service.makeAttributes(key, i18n);

      assert.ok(Array.isArray(attrs));
      assert.strictEqual(attrs.length, 2);
      assert.strictEqual(attrs[0].value, 'English Label');
      assert.strictEqual(attrs[0].locale, 'en');
      assert.strictEqual(attrs[1].value, 'French Label');
      assert.strictEqual(attrs[1].locale, 'fr');
    });

    it('should create attribute without i18n', () => {
      const key = 'label';
      const attrs = service.makeAttributes(key, null);

      assert.ok(Array.isArray(attrs));
      assert.strictEqual(attrs.length, 1);
      assert.strictEqual(attrs[0].value, 'label');
      assert.ok(!attrs[0].locale);
    });

    it('should use key as value if translation missing', () => {
      const key = 'missingKey';
      const i18n = {
        en: { otherKey: 'Other Value' }
      };

      const attrs = service.makeAttributes(key, i18n);

      assert.strictEqual(attrs[0].value, 'missingKey');
    });
  });

  describe('integration with real app', () => {
    it('should work with real app instance', () => {
      const realService = app.service('interview-export');
      assert.ok(realService);
    });
  });
});
