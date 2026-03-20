const assert = require('assert');
const app = require('../../src/app');
const { ParticipantsTasksHandler } = require('../../src/services/participant/participants-tasks-handler.class');

describe('ParticipantsTasksHandler', () => {
  let handler;
  let mockApp;
  let mockServices;

  beforeEach(() => {
    // Create mock services
    mockServices = {
      task: {
        patch: async () => ({}),
        get: async () => ({})
      },
      'interview-design': {
        find: async () => ({ data: [] })
      },
      study: {
        get: async () => ({})
      },
      campaign: {
        find: async () => ({ data: [] })
      },
      participant: {
        find: async () => ({ data: [] }),
        patch: async () => ({})
      },
      interview: {
        find: async () => ({ data: [] })
      },
      user: {
        get: async () => ({})
      }
    };

    // Create mock app
    mockApp = {
      service: (name) => mockServices[name],
      get: (key) => {
        const config = {
          paginate: { max: 1000 },
          amber_visit_url: 'https://test.amber.com',
          tasks: {
            delimiter: ',',
            extension: '.csv'
          }
        };
        return config[key];
      }
    };

    handler = new ParticipantsTasksHandler(mockApp);
  });

  describe('constructor', () => {
    it('should initialize with app', () => {
      assert.ok(handler.app);
      assert.strictEqual(handler.app, mockApp);
    });
  });

  describe('process', () => {
    it('should handle participants-info-activate task type', async () => {
      let called = false;
      handler.sendInfoBeforeActivation = async () => {
        called = true;
      };

      const task = { type: 'participants-info-activate', _id: '123' };
      await handler.process(task);
      assert.strictEqual(called, true);
    });

    it('should handle participants-activate task type', async () => {
      let called = false;
      handler.sendInit = async () => {
        called = true;
      };

      const task = { type: 'participants-activate', _id: '123' };
      await handler.process(task);
      assert.strictEqual(called, true);
    });

    it('should handle participants-reminder task type', async () => {
      let called = false;
      handler.sendReminders = async () => {
        called = true;
      };

      const task = { type: 'participants-reminder', _id: '123' };
      await handler.process(task);
      assert.strictEqual(called, true);
    });

    it('should handle participants-info-expire task type', async () => {
      let called = false;
      handler.sendInfoBeforeDeactivation = async () => {
        called = true;
      };

      const task = { type: 'participants-info-expire', _id: '123' };
      await handler.process(task);
      assert.strictEqual(called, true);
    });

    it('should handle participants-deactivate task type', async () => {
      let called = false;
      handler.deactivate = async () => {
        called = true;
      };

      const task = { type: 'participants-deactivate', _id: '123' };
      await handler.process(task);
      assert.strictEqual(called, true);
    });

    it('should handle participants-summary task type', async () => {
      let called = false;
      handler.summary = async () => {
        called = true;
      };

      const task = { type: 'participants-summary', _id: '123' };
      await handler.process(task);
      assert.strictEqual(called, true);
    });

    it('should handle errors and update task state to aborted', async () => {
      let patchCalled = false;
      let patchData = null;

      mockServices.task.patch = async (id, data) => {
        patchCalled = true;
        patchData = data;
        return {};
      };

      handler.sendInit = async () => {
        throw new Error('Test error');
      };

      const task = { type: 'participants-activate', _id: '123' };
      await handler.process(task);

      assert.strictEqual(patchCalled, true);
      assert.strictEqual(patchData.state, 'aborted');
      assert.strictEqual(patchData.error, 'Test error');
      assert.ok(Array.isArray(patchData.logs));
      assert.strictEqual(patchData.logs[0].level, 'error');
    });
  });

  describe('findActiveInterviewDesigns', () => {
    it('should find active interview designs', async () => {
      const mockDesigns = [
        { _id: '1', state: 'active', name: 'Design 1' },
        { _id: '2', state: 'active', name: 'Design 2' }
      ];

      mockServices['interview-design'].find = async (query) => {
        assert.strictEqual(query.query.state, 'active');
        return { data: mockDesigns };
      };

      const task = { arguments: {} };
      const result = await handler.findActiveInterviewDesigns(task);

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0]._id, '1');
    });

    it('should merge task arguments with query', async () => {
      mockServices['interview-design'].find = async (query) => {
        assert.strictEqual(query.query.state, 'active');
        assert.strictEqual(query.query._id, '123');
        return { data: [] };
      };

      const task = { arguments: { interviewDesign: { _id: '123' } } };
      await handler.findActiveInterviewDesigns(task);
    });
  });

  describe('findValidCampaigns', () => {
    it('should find valid campaigns for interview design', async () => {
      const mockCampaigns = [
        { _id: '1', interviewDesign: 'itwd1', validFrom: null, validUntil: null }
      ];

      mockServices.campaign.find = async (query) => {
        assert.strictEqual(query.query.interviewDesign, 'itwd1');
        return { data: mockCampaigns };
      };

      const task = { arguments: {} };
      const interviewDesign = { _id: 'itwd1' };
      const result = await handler.findValidCampaigns(task, interviewDesign);

      assert.ok(Array.isArray(result));
    });
  });

  describe('isCampaignValid', () => {
    it('should return true for campaign with no time restrictions', () => {
      const campaign = { validFrom: null, validUntil: null };
      assert.strictEqual(handler.isCampaignValid(campaign), true);
    });

    it('should return true for campaign within valid range', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 1000 * 60 * 60 * 24); // 1 day ago
      const future = new Date(now.getTime() + 1000 * 60 * 60 * 24); // 1 day ahead

      const campaign = { validFrom: past, validUntil: future };
      assert.strictEqual(handler.isCampaignValid(campaign), true);
    });

    it('should return false for campaign not yet started', () => {
      const now = new Date();
      const future = new Date(now.getTime() + 1000 * 60 * 60 * 24); // 1 day ahead

      const campaign = { validFrom: future, validUntil: null };
      assert.strictEqual(handler.isCampaignValid(campaign), false);
    });

    it('should return false for expired campaign', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 1000 * 60 * 60 * 24); // 1 day ago

      const campaign = { validFrom: null, validUntil: past };
      assert.strictEqual(handler.isCampaignValid(campaign), false);
    });
  });

  describe('isParticipantInValidRange', () => {
    it('should return true for participant with no time restrictions', () => {
      const participant = { validFrom: null, validUntil: null };
      assert.strictEqual(handler.isParticipantInValidRange(participant), true);
    });

    it('should return true for participant within valid range', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 1000 * 60 * 60 * 24);
      const future = new Date(now.getTime() + 1000 * 60 * 60 * 24);

      const participant = { validFrom: past, validUntil: future };
      assert.strictEqual(handler.isParticipantInValidRange(participant), true);
    });

    it('should return false for participant not yet valid', () => {
      const now = new Date();
      const future = new Date(now.getTime() + 1000 * 60 * 60 * 24);

      const participant = { validFrom: future, validUntil: null };
      assert.strictEqual(handler.isParticipantInValidRange(participant), false);
    });

    it('should return false for expired participant', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 1000 * 60 * 60 * 24);

      const participant = { validFrom: null, validUntil: past };
      assert.strictEqual(handler.isParticipantInValidRange(participant), false);
    });
  });

  describe('isTimeToRemind', () => {
    it('should return false if weeksBetweenReminders is 0', () => {
      const participant = { initAt: new Date() };
      const campaign = { weeksBetweenReminders: 0 };
      const now = new Date();

      assert.strictEqual(handler.isTimeToRemind(participant, campaign, now), false);
    });

    it('should return true if enough time passed since init', () => {
      const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 * 2); // 2 weeks ago
      const participant = { initAt: past, reminders: [] };
      const campaign = { weeksBetweenReminders: 1 };
      const now = new Date();

      assert.strictEqual(handler.isTimeToRemind(participant, campaign, now), true);
    });

    it('should return false if not enough time passed since init', () => {
      const recent = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3); // 3 days ago
      const participant = { initAt: recent, reminders: [] };
      const campaign = { weeksBetweenReminders: 1 };
      const now = new Date();

      assert.strictEqual(handler.isTimeToRemind(participant, campaign, now), false);
    });

    it('should return false if expiration info was already sent', () => {
      const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 * 2);
      const participant = {
        initAt: past,
        reminders: [{ type: 'participants-info-expire', date: new Date() }]
      };
      const campaign = { weeksBetweenReminders: 1 };
      const now = new Date();

      assert.strictEqual(handler.isTimeToRemind(participant, campaign, now), false);
    });
  });

  describe('isTimeToInformBeforeActivate', () => {
    it('should return false if weeksInfoBeforeActivation is 0', () => {
      const participant = { validFrom: new Date() };
      const campaign = { weeksInfoBeforeActivation: 0 };
      const now = new Date();

      assert.strictEqual(handler.isTimeToInformBeforeActivate(participant, campaign, now), false);
    });

    it('should return true if within notification window', () => {
      const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7 * 1); // 1 week ahead
      const participant = { validFrom: future, reminders: [] };
      const campaign = { weeksInfoBeforeActivation: 2 };
      const now = new Date();

      assert.strictEqual(handler.isTimeToInformBeforeActivate(participant, campaign, now), true);
    });

    it('should return false if already notified', () => {
      const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7 * 1);
      const participant = {
        validFrom: future,
        reminders: [{ type: 'participants-info-activate', date: new Date() }]
      };
      const campaign = { weeksInfoBeforeActivation: 2 };
      const now = new Date();

      assert.strictEqual(handler.isTimeToInformBeforeActivate(participant, campaign, now), false);
    });
  });

  describe('isTimeToInformBeforeExpire', () => {
    it('should return false if weeksInfoBeforeDeactivation is 0', () => {
      const participant = { initAt: new Date() };
      const campaign = { weeksInfoBeforeDeactivation: 0, weeksToDeactivate: 4 };
      const now = new Date();

      assert.strictEqual(handler.isTimeToInformBeforeExpire(participant, campaign, now), false);
    });

    it('should return true if within notification window', () => {
      // Campaign: deactivate after 4 weeks, notify 1 week before
      // So notify at: 4 - 1 = 3 weeks after init
      const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 * 3.5); // 3.5 weeks ago
      const participant = { initAt: past, reminders: [] };
      const campaign = { weeksInfoBeforeDeactivation: 1, weeksToDeactivate: 4 };
      const now = new Date();

      assert.strictEqual(handler.isTimeToInformBeforeExpire(participant, campaign, now), true);
    });

    it('should return false if already notified', () => {
      const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 * 3);
      const participant = {
        initAt: past,
        reminders: [{ type: 'participants-info-expire', date: new Date() }]
      };
      const campaign = { weeksInfoBeforeDeactivation: 1, weeksToDeactivate: 4 };
      const now = new Date();

      assert.strictEqual(handler.isTimeToInformBeforeExpire(participant, campaign, now), false);
    });
  });

  describe('isTimeToExpire', () => {
    it('should return true if deactivation time passed', () => {
      const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 * 5); // 5 weeks ago
      const participant = { initAt: past };
      const campaign = { weeksToDeactivate: 4 };
      const now = new Date();

      assert.strictEqual(handler.isTimeToExpire(participant, campaign, now), true);
    });

    it('should return false if deactivation time not reached', () => {
      const recent = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 * 2); // 2 weeks ago
      const participant = { initAt: recent };
      const campaign = { weeksToDeactivate: 4 };
      const now = new Date();

      assert.strictEqual(handler.isTimeToExpire(participant, campaign, now), false);
    });
  });

  describe('getAmberVisitUrl', () => {
    it('should return campaign visitUrl with trailing slash', () => {
      const campaign = { visitUrl: 'https://custom.url.com' };
      const result = handler.getAmberVisitUrl(campaign);
      assert.strictEqual(result, 'https://custom.url.com/');
    });

    it('should return campaign visitUrl if already has trailing slash', () => {
      const campaign = { visitUrl: 'https://custom.url.com/' };
      const result = handler.getAmberVisitUrl(campaign);
      assert.strictEqual(result, 'https://custom.url.com/');
    });

    it('should return default app visitUrl if campaign has none', () => {
      const campaign = {};
      const result = handler.getAmberVisitUrl(campaign);
      assert.strictEqual(result, 'https://test.amber.com/');
    });
  });

  describe('toParticipantsCSV', () => {
    it('should generate CSV without visitUrl', () => {
      const participants = [
        { code: 'P001', identifier: 'ID001', data: { age: 30, gender: 'M' } },
        { code: 'P002', identifier: 'ID002', data: { age: 25, gender: 'F' } }
      ];

      const csv = handler.toParticipantsCSV(participants, undefined);

      assert.ok(csv.includes('identifier'));
      assert.ok(csv.includes('ID001'));
      assert.ok(csv.includes('ID002'));
      assert.ok(!csv.includes('url'));
    });

    it('should generate CSV with visitUrl', () => {
      const participants = [
        { code: 'P001', identifier: 'ID001', data: { age: 30 } }
      ];

      const csv = handler.toParticipantsCSV(participants, 'https://test.com/');

      assert.ok(csv.includes('code'));
      assert.ok(csv.includes('identifier'));
      assert.ok(csv.includes('url'));
      assert.ok(csv.includes('https://test.com/go/P001'));
    });

    it('should handle participants without data field', () => {
      const participants = [
        { code: 'P001', identifier: 'ID001' }
      ];

      const csv = handler.toParticipantsCSV(participants, undefined);

      assert.ok(csv.includes('identifier'));
      assert.ok(csv.includes('ID001'));
    });
  });

  describe('toInterviewsCSV', () => {
    it('should generate CSV for interviews', () => {
      const interviews = [
        { code: 'I001', identifier: 'ID001', updatedAt: new Date() },
        { code: 'I002', identifier: 'ID002', updatedAt: new Date() }
      ];

      const csv = handler.toInterviewsCSV(interviews);

      assert.ok(csv);
      assert.ok(csv.includes('code'));
      assert.ok(csv.includes('identifier'));
      assert.ok(csv.includes('updatedAt'));
    });

    it('should return undefined for empty interviews array', () => {
      const csv = handler.toInterviewsCSV([]);
      assert.strictEqual(csv, undefined);
    });
  });

  describe('getDelimiter', () => {
    it('should return delimiter from app config', () => {
      const delimiter = handler.getDelimiter();
      assert.strictEqual(delimiter, ',');
    });
  });

  describe('getExtension', () => {
    it('should return extension from app config', () => {
      const extension = handler.getExtension();
      assert.strictEqual(extension, '.csv');
    });
  });

  describe('integration with real app', () => {
    it('should be instantiable with real app', () => {
      const realHandler = new ParticipantsTasksHandler(app);
      assert.ok(realHandler);
      assert.ok(realHandler.app);
    });
  });
});
