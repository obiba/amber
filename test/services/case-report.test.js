const assert = require('assert');
const app = require('../../src/app');

describe('\'case-report\' service', () => {
  it('registered the service', () => {
    const service = app.service('case-report');

    assert.ok(service, 'Registered the service');
  });
});
