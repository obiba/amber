const assert = require('assert');
const appPromise = require('../../src/app');
let app;
const { InterviewDesignI18nExport } = require('../../src/services/interview-design-i18n/interview-design-i18n.class');
const { BadRequest } = require('@feathersjs/errors');

before(async function() { this.timeout(30000); app = await appPromise; });

describe('\'interview-design-i18n\' service', () => {
  let service;
  let mockApp;
  let mockInterviewDesignService;

  beforeEach(() => {
    // Create mock interview-design service
    mockInterviewDesignService = {
      get: async (id) => ({
        _id: id,
        name: 'Test Interview Design',
        description: 'Test Description',
        schema: {
          steps: [
            {
              name: 'step1',
              form: 'form1'
            }
          ],
          i18n: {
            en: {
              step1: 'Step 1',
              welcome: 'Welcome',
              instructions: 'Please complete the following steps'
            },
            fr: {
              step1: 'Étape 1',
              welcome: 'Bienvenue',
              instructions: 'Veuillez compléter les étapes suivantes'
            },
            es: {
              step1: 'Paso 1',
              welcome: 'Bienvenido'
            }
          }
        }
      })
    };

    // Create mock app
    mockApp = {
      service: (name) => {
        if (name === 'interview-design') return mockInterviewDesignService;
        return null;
      },
      get: (key) => {
        if (key === 'paginate') return { max: 1000 };
        return null;
      }
    };

    service = new InterviewDesignI18nExport({ paginate: { max: 1000 } }, mockApp);
  });

  describe('service registration', () => {
    it('registered the service', () => {
      const registeredService = app.service('interview-design-i18n');
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
    it('should retrieve interview design by id', async () => {
      const result = await service.get('itwd123');
      
      assert.ok(result);
      assert.strictEqual(result._id, 'itwd123');
      assert.strictEqual(result.name, 'Test Interview Design');
    });

    it('should return interview design with i18n data', async () => {
      const result = await service.get('itwd123');
      
      assert.ok(result.schema);
      assert.ok(result.schema.i18n);
      assert.ok(result.schema.i18n.en);
      assert.ok(result.schema.i18n.fr);
    });

    it('should return interview design with all locales', async () => {
      const result = await service.get('itwd123');
      
      const locales = Object.keys(result.schema.i18n);
      assert.strictEqual(locales.length, 3);
      assert.ok(locales.includes('en'));
      assert.ok(locales.includes('fr'));
      assert.ok(locales.includes('es'));
    });

    it('should return interview design with correct translation keys', async () => {
      const result = await service.get('itwd123');
      
      assert.strictEqual(result.schema.i18n.en.step1, 'Step 1');
      assert.strictEqual(result.schema.i18n.fr.step1, 'Étape 1');
      assert.strictEqual(result.schema.i18n.es.step1, 'Paso 1');
    });

    it('should handle interview design without i18n data', async () => {
      mockInterviewDesignService.get = async (id) => ({
        _id: id,
        name: 'No i18n Design',
        schema: {
          steps: []
        }
      });

      const result = await service.get('itwd456');
      
      assert.ok(result);
      assert.strictEqual(result.name, 'No i18n Design');
    });

    it('should handle interview design with empty i18n object', async () => {
      mockInterviewDesignService.get = async (id) => ({
        _id: id,
        name: 'Empty i18n Design',
        schema: {
          steps: [],
          i18n: {}
        }
      });

      const result = await service.get('itwd789');
      
      assert.ok(result);
      assert.ok(result.schema.i18n);
      assert.strictEqual(Object.keys(result.schema.i18n).length, 0);
    });
  });

  describe('find', () => {
    it('should throw BadRequest error', async () => {
      try {
        await service.find({});
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

  describe('integration with interview-design service', () => {
    it('should call interview-design service get method', async () => {
      let calledWithId = null;
      mockInterviewDesignService.get = async (id) => {
        calledWithId = id;
        return {
          _id: id,
          name: 'Test',
          schema: { i18n: {} }
        };
      };

      await service.get('testId123');
      
      assert.strictEqual(calledWithId, 'testId123');
    });

    it('should pass through interview-design service errors', async () => {
      const testError = new Error('Interview design not found');
      mockInterviewDesignService.get = async () => {
        throw testError;
      };

      try {
        await service.get('nonexistent');
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(error, testError);
      }
    });
  });

  describe('i18n export data structure', () => {
    it('should preserve multiple translation keys per locale', async () => {
      const result = await service.get('itwd123');
      
      assert.strictEqual(result.schema.i18n.en.step1, 'Step 1');
      assert.strictEqual(result.schema.i18n.en.welcome, 'Welcome');
      assert.strictEqual(result.schema.i18n.en.instructions, 'Please complete the following steps');
    });

    it('should handle missing keys in some locales', async () => {
      const result = await service.get('itwd123');
      
      assert.ok(result.schema.i18n.en.instructions);
      assert.ok(result.schema.i18n.fr.instructions);
      assert.strictEqual(result.schema.i18n.es.instructions, undefined);
    });

    it('should handle special characters in translation values', async () => {
      mockInterviewDesignService.get = async (id) => ({
        _id: id,
        name: 'Special Chars',
        schema: {
          i18n: {
            en: {
              message: 'Hello, "world"! & <welcome>'
            },
            fr: {
              message: 'Bonjour, "monde"! & <bienvenue>'
            }
          }
        }
      });

      const result = await service.get('special123');
      
      assert.strictEqual(result.schema.i18n.en.message, 'Hello, "world"! & <welcome>');
      assert.strictEqual(result.schema.i18n.fr.message, 'Bonjour, "monde"! & <bienvenue>');
    });

    it('should handle empty string values', async () => {
      mockInterviewDesignService.get = async (id) => ({
        _id: id,
        name: 'Empty Strings',
        schema: {
          i18n: {
            en: {
              emptyKey: ''
            }
          }
        }
      });

      const result = await service.get('empty123');
      
      assert.strictEqual(result.schema.i18n.en.emptyKey, '');
    });
  });

  describe('edge cases', () => {
    it('should handle interview design with single locale', async () => {
      mockInterviewDesignService.get = async (id) => ({
        _id: id,
        name: 'Single Locale',
        schema: {
          i18n: {
            en: {
              key1: 'Value 1'
            }
          }
        }
      });

      const result = await service.get('single123');
      
      const locales = Object.keys(result.schema.i18n);
      assert.strictEqual(locales.length, 1);
      assert.strictEqual(locales[0], 'en');
    });

    it('should handle interview design with many locales', async () => {
      mockInterviewDesignService.get = async (id) => ({
        _id: id,
        name: 'Many Locales',
        schema: {
          i18n: {
            en: { key: 'English' },
            fr: { key: 'Français' },
            es: { key: 'Español' },
            de: { key: 'Deutsch' },
            it: { key: 'Italiano' },
            pt: { key: 'Português' }
          }
        }
      });

      const result = await service.get('many123');
      
      const locales = Object.keys(result.schema.i18n);
      assert.strictEqual(locales.length, 6);
    });

    it('should handle nested translation keys', async () => {
      mockInterviewDesignService.get = async (id) => ({
        _id: id,
        name: 'Nested Keys',
        schema: {
          steps: [],
          i18n: {
            en: {
              'step1.title': 'Step 1 Title',
              'step1.description': 'Step 1 Description',
              'step2.title': 'Step 2 Title'
            }
          }
        }
      });

      const result = await service.get('nested123');
      
      assert.strictEqual(result.schema.i18n.en['step1.title'], 'Step 1 Title');
      assert.strictEqual(result.schema.i18n.en['step1.description'], 'Step 1 Description');
    });
  });

  describe('integration with real app', () => {
    it('should work with real app instance', () => {
      const registeredService = app.service('interview-design-i18n');
      assert.ok(registeredService);
      assert.strictEqual(typeof registeredService.get, 'function');
    });
  });
});
