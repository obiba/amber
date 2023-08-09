const assert = require('assert');
const app = require('../../src/app');

describe('\'interview-design-i18n\' service', () => {
  it('registered the service', () => {
    const service = app.service('interview-design-i18n');

    assert.ok(service, 'Registered the service');
  });
});
