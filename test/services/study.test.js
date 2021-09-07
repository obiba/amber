const assert = require('assert');
const app = require('../../src/app');

describe('\'study\' service', () => {
  it('registered the service', () => {
    const service = app.service('study');

    assert.ok(service, 'Registered the service');
  });
});
