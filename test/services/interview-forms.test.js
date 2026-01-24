const assert = require('assert');
const app = require('../../src/app');

describe('\'interview-design\' service', () => {
  it('registered the service', () => {
    const service = app.service('interview-design');

    assert.ok(service, 'Registered the service');
  });
});
