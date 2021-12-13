const assert = require('assert');
const app = require('../../src/app');

describe('\'form-revision-digest\' service', () => {
  it('registered the service', () => {
    const service = app.service('form-revision-digest');

    assert.ok(service, 'Registered the service');
  });
});
