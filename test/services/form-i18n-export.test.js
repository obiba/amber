const assert = require('assert');
const app = require('../../src/app');

describe('\'form-i18n-export\' service', () => {
  it('registered the service', () => {
    const service = app.service('form-i18n-export');

    assert.ok(service, 'Registered the service');
  });
});
