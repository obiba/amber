const { authenticate } = require('@feathersjs/authentication').hooks;
const allowDataApiKey = require('../../hooks/allow-data-api-key');

const interviewExportAudit = require('../../hooks/interview-export-audit');

module.exports = {
  before: {
    all: [allowDataApiKey(), authenticate('jwt', 'dataApiKey')],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [interviewExportAudit()],
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
