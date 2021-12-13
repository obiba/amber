const assert = require('assert');
const app = require('../../src/app');

describe('\'crfs\' service', () => {
  it('registered the service', () => {
    const service = app.service('crfs');

    assert.ok(service, 'Registered the service');
  });
});
