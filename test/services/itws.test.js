const assert = require('assert');
const app = require('../../src/app');

describe('\'itws\' service', () => {
  it('registered the service', () => {
    const service = app.service('itws');

    assert.ok(service, 'Registered the service');
  });
});
