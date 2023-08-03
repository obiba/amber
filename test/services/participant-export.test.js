const assert = require('assert');
const app = require('../../src/app');

describe('\'participant-export\' service', () => {
  it('registered the service', () => {
    const service = app.service('participant-export');

    assert.ok(service, 'Registered the service');
  });
});
