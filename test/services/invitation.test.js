const assert = require('assert');
const app = require('../../src/app');

describe('\'invitation\' service', () => {
  it('registered the service', () => {
    const service = app.service('invitation');

    assert.ok(service, 'Registered the service');
  });
});
