const assert = require('assert');
const app = require('../../src/app');

describe('\'form\' service', () => {
  it('registered the service', () => {
    const service = app.service('form');

    assert.ok(service, 'Registered the service');
  });
});
