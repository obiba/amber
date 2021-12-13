const assert = require('assert');
const app = require('../../src/app');

describe('\'case-report-form\' service', () => {
  it('registered the service', () => {
    const service = app.service('case-report-form');

    assert.ok(service, 'Registered the service');
  });
});
