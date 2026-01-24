const assert = require('assert');
const app = require('../../src/app');

describe('\'participant\' service', () => {
  it('registered the service', () => {
    const service = app.service('participant');

    assert.ok(service, 'Registered the service');
  });
});
