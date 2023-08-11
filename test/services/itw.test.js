const assert = require('assert');
const app = require('../../src/app');

describe('\'itw\' service', () => {
  it('registered the service', () => {
    const service = app.service('itw');

    assert.ok(service, 'Registered the service');
  });
});
