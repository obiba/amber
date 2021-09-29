const assert = require('assert');
const app = require('../../src/app');

describe('\'group\' service', () => {
  it('registered the service', () => {
    const service = app.service('group');

    assert.ok(service, 'Registered the service');
  });
});
