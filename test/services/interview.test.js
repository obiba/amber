const assert = require('assert');
const app = require('../../src/app');

describe('\'interview\' service', () => {
  it('registered the service', () => {
    const service = app.service('interview');

    assert.ok(service, 'Registered the service');
  });
});
