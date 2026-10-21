const { authenticate } = require('@feathersjs/authentication').hooks;
const allowDataApiKey = require('../../hooks/allow-data-api-key');

const caseReportExportAudit = require('../../hooks/case-report-export-audit');

module.exports = {
  before: {
    all: [
      allowDataApiKey(),
      authenticate('jwt', 'dataApiKey')
    ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [caseReportExportAudit()],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
