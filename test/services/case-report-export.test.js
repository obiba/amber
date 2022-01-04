const assert = require('assert');
const app = require('../../src/app');

describe('\'case-report-export\' service', () => {
  it('registered the service', () => {
    const service = app.service('case-report-export');

    assert.ok(service, 'Registered the service');
  });
});
