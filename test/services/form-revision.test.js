const assert = require('assert');
const app = require('../../src/app');

describe('\'form-revision\' service', () => {
  it('registered the service', () => {
    const service = app.service('form-revision');

    assert.ok(service, 'Registered the service');
  });
});
