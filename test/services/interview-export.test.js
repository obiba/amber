const assert = require('assert');
const app = require('../../src/app');

describe('\'interview-export\' service', () => {
  it('registered the service', () => {
    const service = app.service('interview-export');

    assert.ok(service, 'Registered the service');
  });
});
