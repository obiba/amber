const assert = require('assert');
const app = require('../../src/app');

describe('\'interview-forms\' service', () => {
  it('registered the service', () => {
    const service = app.service('interview-forms');

    assert.ok(service, 'Registered the service');
  });
});
