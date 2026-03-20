const assert = require('assert');
const app = require('../../src/app');
const { ParticipantExport } = require('../../src/services/participant-export/participant-export.class');
const { BadRequest } = require('@feathersjs/errors');

describe('\'participant-export\' service', () => {
  let service;
  let mockApp;
  let mockServices;

  beforeEach(() => {
    // Create mock services
    mockServices = {
      participant: {
        find: async (params) => ({
          data: [],
          total: 0,
          limit: params.query.$limit || 10,
          skip: params.query.$skip || 0
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

    service = new ParticipantExport({ paginate: { max: 1000 } }, mockApp);
  });

  describe('service registration', () => {
    it('registered the service', () => {
      const registeredService = app.service('participant-export');
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
      const serviceWithoutOptions = new ParticipantExport(null, mockApp);
      assert.ok(serviceWithoutOptions.options);
      assert.deepStrictEqual(serviceWithoutOptions.options, {});
    });
  });

  describe('formatDate', () => {
    it('should format Date object to ISO date string', () => {
      const date = new Date('2024-03-15T10:30:00Z');
      const formatted = service.formatDate(date);
      assert.strictEqual(formatted, '2024-03-15');
    });

    it('should format date string to ISO date', () => {
      const dateStr = '2024-12-25T23:59:59Z';
      const formatted = service.formatDate(dateStr);
      assert.strictEqual(formatted, '2024-12-25');
    });

    it('should handle null date', () => {
      const formatted = service.formatDate(null);
      assert.strictEqual(formatted, null);
    });

    it('should handle undefined date', () => {
      const formatted = service.formatDate(undefined);
      assert.strictEqual(formatted, undefined);
    });

    it('should handle date at midnight', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const formatted = service.formatDate(date);
      assert.strictEqual(formatted, '2024-01-01');
    });

    it('should handle date with milliseconds', () => {
      const date = new Date('2024-06-15T14:30:45.123Z');
      const formatted = service.formatDate(date);
      assert.strictEqual(formatted, '2024-06-15');
    });

    it('should handle timestamp number', () => {
      const timestamp = 1710504600000; // March 15, 2024
      const formatted = service.formatDate(timestamp);
      assert.strictEqual(formatted, '2024-03-15');
    });
  });

  describe('find', () => {
    it('should return empty array when no participants', async () => {
      mockServices.participant.find = async () => ({
        data: [],
        total: 0
      });

      const result = await service.find({ query: {} });

      assert.ok(Array.isArray(result));
      assert.strictEqual(result.length, 0);
    });

    it('should format participant data correctly', async () => {
      mockServices.participant.find = async () => ({
        data: [{
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31'),
          activated: true,
          data: { age: 30, gender: 'M' },
          campaign: 'campaign1'
        }],
        total: 1
      });

      const result = await service.find({ query: {} });

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].code, 'P001');
      assert.strictEqual(result[0].identifier, 'ID001');
      assert.strictEqual(result[0].validFrom, '2024-01-01');
      assert.strictEqual(result[0].validUntil, '2024-12-31');
      assert.strictEqual(result[0].activated, true);
      assert.deepStrictEqual(result[0].data, { age: 30, gender: 'M' });
    });

    it('should not include extra fields in export', async () => {
      mockServices.participant.find = async () => ({
        data: [{
          _id: 'p1',
          code: 'P001',
          identifier: 'ID001',
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31'),
          activated: true,
          data: { age: 30 },
          campaign: 'campaign1',
          createdAt: new Date(),
          updatedAt: new Date()
        }],
        total: 1
      });

      const result = await service.find({ query: {} });

      assert.strictEqual(result.length, 1);
      assert.ok(!result[0]._id);
      assert.ok(!result[0].campaign);
      assert.ok(!result[0].createdAt);
      assert.ok(!result[0].updatedAt);
    });

    it('should handle multiple participants', async () => {
      mockServices.participant.find = async () => ({
        data: [
          {
            code: 'P001',
            identifier: 'ID001',
            validFrom: new Date('2024-01-01'),
            validUntil: new Date('2024-12-31'),
            activated: true,
            data: { age: 30 }
          },
          {
            code: 'P002',
            identifier: 'ID002',
            validFrom: new Date('2024-02-01'),
            validUntil: new Date('2024-11-30'),
            activated: false,
            data: { age: 25 }
          },
          {
            code: 'P003',
            identifier: 'ID003',
            validFrom: null,
            validUntil: null,
            activated: true,
            data: { age: 35 }
          }
        ],
        total: 3
      });

      const result = await service.find({ query: {} });

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].code, 'P001');
      assert.strictEqual(result[1].code, 'P002');
      assert.strictEqual(result[2].code, 'P003');
      assert.strictEqual(result[0].activated, true);
      assert.strictEqual(result[1].activated, false);
      assert.strictEqual(result[2].validFrom, null);
    });

    it('should pass query params to participant service', async () => {
      let receivedParams = null;
      mockServices.participant.find = async (params) => {
        receivedParams = params;
        return { data: [], total: 0 };
      };

      await service.find({
        query: {
          campaign: 'campaign123',
          activated: true,
          $limit: 50,
          $skip: 10
        }
      });

      assert.ok(receivedParams);
      assert.strictEqual(receivedParams.query.campaign, 'campaign123');
      assert.strictEqual(receivedParams.query.activated, true);
      assert.strictEqual(receivedParams.query.$limit, 50);
      assert.strictEqual(receivedParams.query.$skip, 10);
    });

    it('should handle participants without data field', async () => {
      mockServices.participant.find = async () => ({
        data: [{
          code: 'P001',
          identifier: 'ID001',
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31'),
          activated: true
        }],
        total: 1
      });

      const result = await service.find({ query: {} });

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].code, 'P001');
      assert.ok(!result[0].data || result[0].data === undefined);
    });

    it('should handle participants with empty data object', async () => {
      mockServices.participant.find = async () => ({
        data: [{
          code: 'P001',
          identifier: 'ID001',
          validFrom: new Date('2024-01-01'),
          validUntil: null,
          activated: true,
          data: {}
        }],
        total: 1
      });

      const result = await service.find({ query: {} });

      assert.strictEqual(result.length, 1);
      assert.deepStrictEqual(result[0].data, {});
    });

    it('should handle complex data field', async () => {
      mockServices.participant.find = async () => ({
        data: [{
          code: 'P001',
          identifier: 'ID001',
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31'),
          activated: true,
          data: {
            demographics: {
              age: 30,
              gender: 'M'
            },
            contact: {
              email: 'test@example.com',
              phone: '123-456-7890'
            },
            tags: ['tag1', 'tag2']
          }
        }],
        total: 1
      });

      const result = await service.find({ query: {} });

      assert.strictEqual(result.length, 1);
      assert.ok(result[0].data);
      assert.ok(result[0].data.demographics);
      assert.strictEqual(result[0].data.demographics.age, 30);
      assert.ok(Array.isArray(result[0].data.tags));
    });

    it('should handle dates that are already formatted', async () => {
      mockServices.participant.find = async () => ({
        data: [{
          code: 'P001',
          identifier: 'ID001',
          validFrom: '2024-01-01T00:00:00.000Z',
          validUntil: '2024-12-31T23:59:59.999Z',
          activated: true,
          data: {}
        }],
        total: 1
      });

      const result = await service.find({ query: {} });

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].validFrom, '2024-01-01');
      assert.strictEqual(result[0].validUntil, '2024-12-31');
    });

    it('should maintain data integrity for large datasets', async () => {
      const participants = [];
      for (let i = 1; i <= 100; i++) {
        participants.push({
          code: `P${String(i).padStart(3, '0')}`,
          identifier: `ID${i}`,
          validFrom: new Date(`2024-01-${String(i % 28 + 1).padStart(2, '0')}`),
          validUntil: new Date(`2024-12-${String(i % 28 + 1).padStart(2, '0')}`),
          activated: i % 2 === 0,
          data: { sequenceNumber: i }
        });
      }

      mockServices.participant.find = async () => ({
        data: participants,
        total: 100
      });

      const result = await service.find({ query: {} });

      assert.strictEqual(result.length, 100);
      assert.strictEqual(result[0].code, 'P001');
      assert.strictEqual(result[99].code, 'P100');
      assert.strictEqual(result[0].data.sequenceNumber, 1);
      assert.strictEqual(result[99].data.sequenceNumber, 100);
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

  describe('edge cases', () => {
    it('should handle participants with special characters in data', async () => {
      mockServices.participant.find = async () => ({
        data: [{
          code: 'P001',
          identifier: 'ID001',
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31'),
          activated: true,
          data: {
            notes: 'Special chars: é, ñ, ü, 中文, 日本語',
            symbols: '!@#$%^&*()',
            quotes: 'He said "hello"'
          }
        }],
        total: 1
      });

      const result = await service.find({ query: {} });

      assert.strictEqual(result.length, 1);
      assert.ok(result[0].data.notes.includes('é'));
      assert.ok(result[0].data.notes.includes('中文'));
      assert.strictEqual(result[0].data.symbols, '!@#$%^&*()');
    });

    it('should handle participants with null identifier', async () => {
      mockServices.participant.find = async () => ({
        data: [{
          code: 'P001',
          identifier: null,
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31'),
          activated: true,
          data: {}
        }],
        total: 1
      });

      const result = await service.find({ query: {} });

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].identifier, null);
    });

    it('should handle participants with undefined fields', async () => {
      mockServices.participant.find = async () => ({
        data: [{
          code: 'P001',
          identifier: 'ID001',
          validFrom: undefined,
          validUntil: undefined,
          activated: true,
          data: undefined
        }],
        total: 1
      });

      const result = await service.find({ query: {} });

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].validFrom, undefined);
      assert.strictEqual(result[0].validUntil, undefined);
      assert.strictEqual(result[0].data, undefined);
    });

    it('should throw error for invalid date objects', async () => {
      mockServices.participant.find = async () => ({
        data: [{
          code: 'P001',
          identifier: 'ID001',
          validFrom: new Date('invalid'),
          validUntil: new Date('also-invalid'),
          activated: true,
          data: {}
        }],
        total: 1
      });

      try {
        await service.find({ query: {} });
        assert.fail('Should have thrown an error for invalid date');
      } catch (err) {
        assert.ok(err instanceof RangeError);
        assert.ok(err.message.includes('Invalid time value'));
      }
    });
  });

  describe('data transformation', () => {
    it('should preserve nested object structures', async () => {
      mockServices.participant.find = async () => ({
        data: [{
          code: 'P001',
          identifier: 'ID001',
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31'),
          activated: true,
          data: {
            level1: {
              level2: {
                level3: {
                  value: 'deeply nested'
                }
              }
            }
          }
        }],
        total: 1
      });

      const result = await service.find({ query: {} });

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].data.level1.level2.level3.value, 'deeply nested');
    });

    it('should preserve array data types', async () => {
      mockServices.participant.find = async () => ({
        data: [{
          code: 'P001',
          identifier: 'ID001',
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31'),
          activated: true,
          data: {
            measurements: [10, 20, 30, 40],
            tags: ['tag1', 'tag2', 'tag3'],
            mixed: [1, 'two', { three: 3 }]
          }
        }],
        total: 1
      });

      const result = await service.find({ query: {} });

      assert.strictEqual(result.length, 1);
      assert.ok(Array.isArray(result[0].data.measurements));
      assert.strictEqual(result[0].data.measurements.length, 4);
      assert.strictEqual(result[0].data.tags[1], 'tag2');
      assert.strictEqual(result[0].data.mixed[2].three, 3);
    });

    it('should handle boolean values correctly', async () => {
      mockServices.participant.find = async () => ({
        data: [{
          code: 'P001',
          identifier: 'ID001',
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31'),
          activated: false,
          data: {
            consented: true,
            declined: false
          }
        }],
        total: 1
      });

      const result = await service.find({ query: {} });

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].activated, false);
      assert.strictEqual(result[0].data.consented, true);
      assert.strictEqual(result[0].data.declined, false);
    });

    it('should handle numeric values including zero', async () => {
      mockServices.participant.find = async () => ({
        data: [{
          code: 'P001',
          identifier: 'ID001',
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31'),
          activated: true,
          data: {
            score: 0,
            count: 100,
            negative: -50,
            decimal: 3.14159
          }
        }],
        total: 1
      });

      const result = await service.find({ query: {} });

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].data.score, 0);
      assert.strictEqual(result[0].data.count, 100);
      assert.strictEqual(result[0].data.negative, -50);
      assert.strictEqual(result[0].data.decimal, 3.14159);
    });
  });

  describe('integration with real app', () => {
    it('should work with real app instance', () => {
      const realService = app.service('participant-export');
      assert.ok(realService);
    });
  });
});
