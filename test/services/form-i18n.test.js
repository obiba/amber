const assert = require('assert');
const appPromise = require('../../src/app');
let app;
const { FormI18nExport } = require('../../src/services/form-i18n/form-i18n.class');
const { BadRequest } = require('@feathersjs/errors');

before(async function() { this.timeout(30000); app = await appPromise; });

describe('\'form-i18n\' service', () => {
  let service;
  let mockApp;
  let mockFormService;

  beforeEach(() => {
    // Create mock form service
    mockFormService = {
      get: async (id) => ({
        _id: id,
        name: 'Test Form',
        schema: {
          items: [
            { name: 'field1', type: 'text' },
            { name: 'field2', type: 'number' }
          ],
          i18n: {
            en: {
              field1: 'Field 1',
              field2: 'Field 2',
              title: 'Form Title'
            },
            fr: {
              field1: 'Champ 1',
              field2: 'Champ 2',
              title: 'Titre du formulaire'
            },
            es: {
              field1: 'Campo 1',
              field2: 'Campo 2'
            }
          }
        }
      })
    };

    // Create mock app
    mockApp = {
      service: (name) => {
        if (name === 'form') return mockFormService;
        return null;
      },
      get: (key) => {
        if (key === 'paginate') return { max: 1000 };
        return null;
      }
    };

    service = new FormI18nExport({ paginate: { max: 1000 } }, mockApp);
  });

  describe('service registration', () => {
    it('registered the service', () => {
      const registeredService = app.service('form-i18n');
      assert.ok(registeredService, 'Registered the service');
    });
  });

  describe('constructor', () => {
    it('should initialize with options and app', () => {
      assert.ok(service.app);
      assert.ok(service.options);
    });

    it('should store the app instance', () => {
      assert.strictEqual(service.app, mockApp);
    });

    it('should store the options', () => {
      assert.deepStrictEqual(service.options, { paginate: { max: 1000 } });
    });
  });

  describe('get', () => {
    it('should retrieve form by id', async () => {
      const result = await service.get('form123');
      
      assert.ok(result);
      assert.strictEqual(result._id, 'form123');
      assert.strictEqual(result.name, 'Test Form');
    });

    it('should return form with i18n data', async () => {
      const result = await service.get('form123');
      
      assert.ok(result.schema);
      assert.ok(result.schema.i18n);
      assert.ok(result.schema.i18n.en);
      assert.ok(result.schema.i18n.fr);
    });

    it('should return form with all locales', async () => {
      const result = await service.get('form123');
      
      const locales = Object.keys(result.schema.i18n);
      assert.strictEqual(locales.length, 3);
      assert.ok(locales.includes('en'));
      assert.ok(locales.includes('fr'));
      assert.ok(locales.includes('es'));
    });

    it('should retrieve form with correct translation keys', async () => {
      const result = await service.get('form123');
      
      assert.strictEqual(result.schema.i18n.en.field1, 'Field 1');
      assert.strictEqual(result.schema.i18n.fr.field1, 'Champ 1');
      assert.strictEqual(result.schema.i18n.es.field1, 'Campo 1');
    });

    it('should handle form without i18n data', async () => {
      mockFormService.get = async (id) => ({
        _id: id,
        name: 'Form Without I18n',
        schema: {
          items: [{ name: 'field1', type: 'text' }]
        }
      });

      const result = await service.get('form456');
      
      assert.ok(result);
      assert.strictEqual(result.name, 'Form Without I18n');
      assert.ok(!result.schema.i18n);
    });

    it('should handle form with empty i18n object', async () => {
      mockFormService.get = async (id) => ({
        _id: id,
        name: 'Form With Empty I18n',
        schema: {
          items: [{ name: 'field1', type: 'text' }],
          i18n: {}
        }
      });

      const result = await service.get('form789');
      
      assert.ok(result);
      assert.deepStrictEqual(result.schema.i18n, {});
    });
  });

  describe('find', () => {
    it('should throw BadRequest error', async () => {
      try {
        await service.find();
        assert.fail('Should have thrown BadRequest');
      } catch (error) {
        assert.ok(error instanceof BadRequest);
        assert.strictEqual(error.message, 'Not implemented');
      }
    });
  });

  describe('create', () => {
    it('should throw BadRequest error', async () => {
      try {
        await service.create({});
        assert.fail('Should have thrown BadRequest');
      } catch (error) {
        assert.ok(error instanceof BadRequest);
        assert.strictEqual(error.message, 'Not implemented');
      }
    });
  });

  describe('update', () => {
    it('should throw BadRequest error', async () => {
      try {
        await service.update('id', {});
        assert.fail('Should have thrown BadRequest');
      } catch (error) {
        assert.ok(error instanceof BadRequest);
        assert.strictEqual(error.message, 'Not implemented');
      }
    });
  });

  describe('patch', () => {
    it('should throw BadRequest error', async () => {
      try {
        await service.patch('id', {});
        assert.fail('Should have thrown BadRequest');
      } catch (error) {
        assert.ok(error instanceof BadRequest);
        assert.strictEqual(error.message, 'Not implemented');
      }
    });
  });

  describe('remove', () => {
    it('should throw BadRequest error', async () => {
      try {
        await service.remove('id');
        assert.fail('Should have thrown BadRequest');
      } catch (error) {
        assert.ok(error instanceof BadRequest);
        assert.strictEqual(error.message, 'Not implemented');
      }
    });
  });

  describe('integration with form service', () => {
    it('should call form service get method', async () => {
      let getCalled = false;
      let passedId = null;
      
      mockFormService.get = async (id) => {
        getCalled = true;
        passedId = id;
        return {
          _id: id,
          name: 'Test Form',
          schema: { i18n: {} }
        };
      };

      await service.get('test-form-id');
      
      assert.ok(getCalled, 'Form service get should have been called');
      assert.strictEqual(passedId, 'test-form-id');
    });

    it('should pass through form service errors', async () => {
      mockFormService.get = async () => {
        throw new Error('Form not found');
      };

      try {
        await service.get('nonexistent');
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(error.message, 'Form not found');
      }
    });
  });

  describe('i18n export data structure', () => {
    it('should preserve multiple translation keys per locale', async () => {
      const result = await service.get('form123');
      
      const enKeys = Object.keys(result.schema.i18n.en);
      assert.ok(enKeys.length >= 3);
      assert.ok(enKeys.includes('field1'));
      assert.ok(enKeys.includes('field2'));
      assert.ok(enKeys.includes('title'));
    });

    it('should handle missing keys in some locales', async () => {
      const result = await service.get('form123');
      
      // Spanish locale has fewer keys than English
      assert.ok(result.schema.i18n.es.field1);
      assert.ok(result.schema.i18n.es.field2);
      assert.strictEqual(result.schema.i18n.es.title, undefined);
    });

    it('should handle special characters in translation values', async () => {
      mockFormService.get = async (id) => ({
        _id: id,
        name: 'Test Form',
        schema: {
          i18n: {
            en: {
              field1: 'Field with "quotes"',
              field2: 'Field with \nnewline',
              field3: 'Field with, comma'
            }
          }
        }
      });

      const result = await service.get('special-chars');
      
      assert.strictEqual(result.schema.i18n.en.field1, 'Field with "quotes"');
      assert.strictEqual(result.schema.i18n.en.field2, 'Field with \nnewline');
      assert.strictEqual(result.schema.i18n.en.field3, 'Field with, comma');
    });

    it('should handle empty string values', async () => {
      mockFormService.get = async (id) => ({
        _id: id,
        name: 'Test Form',
        schema: {
          i18n: {
            en: {
              field1: '',
              field2: 'Non-empty'
            }
          }
        }
      });

      const result = await service.get('empty-strings');
      
      assert.strictEqual(result.schema.i18n.en.field1, '');
      assert.strictEqual(result.schema.i18n.en.field2, 'Non-empty');
    });
  });

  describe('edge cases', () => {
    it('should handle form with single locale', async () => {
      mockFormService.get = async (id) => ({
        _id: id,
        name: 'Single Locale Form',
        schema: {
          i18n: {
            en: {
              field1: 'Field 1'
            }
          }
        }
      });

      const result = await service.get('single-locale');
      
      const locales = Object.keys(result.schema.i18n);
      assert.strictEqual(locales.length, 1);
      assert.strictEqual(locales[0], 'en');
    });

    it('should handle form with many locales', async () => {
      mockFormService.get = async (id) => ({
        _id: id,
        name: 'Multi Locale Form',
        schema: {
          i18n: {
            en: { key: 'English' },
            fr: { key: 'French' },
            es: { key: 'Spanish' },
            de: { key: 'German' },
            it: { key: 'Italian' },
            pt: { key: 'Portuguese' }
          }
        }
      });

      const result = await service.get('many-locales');
      
      const locales = Object.keys(result.schema.i18n);
      assert.strictEqual(locales.length, 6);
    });

    it('should handle nested translation keys', async () => {
      mockFormService.get = async (id) => ({
        _id: id,
        name: 'Test Form',
        schema: {
          i18n: {
            en: {
              'section.field1': 'Section Field 1',
              'section.field2': 'Section Field 2'
            }
          }
        }
      });

      const result = await service.get('nested-keys');
      
      assert.strictEqual(result.schema.i18n.en['section.field1'], 'Section Field 1');
      assert.strictEqual(result.schema.i18n.en['section.field2'], 'Section Field 2');
    });
  });
});
