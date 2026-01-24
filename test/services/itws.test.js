const assert = require('assert');
const app = require('../../src/app');

describe('\'itwd\' service', () => {
  it('registered the service', () => {
    const service = app.service('itwd');

    assert.ok(service, 'Registered the service');
  });
});
