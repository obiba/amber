const { authenticate } = require('@feathersjs/authentication').hooks;

const { authorize } = require('feathers-casl').hooks;
const { defineAbilitiesFor } = require('./case-report.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const caseReportCreate = require('../../hooks/case-report-create');
const searchQuery = require('../../hooks/search-query');

const caseReportEncrypt = require('../../hooks/case-report-encrypt');

const caseReportDecrypt = require('../../hooks/case-report-decrypt');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [
      searchQuery(),
      authorize({ adapter: 'feathers-mongoose' })
    ],
    get: [
      authorize({ adapter: 'feathers-mongoose' })
    ],
    create: [
      caseReportCreate(),
      authorize({ adapter: 'feathers-mongoose' }),
      caseReportEncrypt()
    ],
    update: [
      authorize({ adapter: 'feathers-mongoose' }),
      caseReportEncrypt()
    ],
    patch: [
      authorize({ adapter: 'feathers-mongoose' }),
      caseReportEncrypt()
    ],
    remove: [
      authorize({ adapter: 'feathers-mongoose' })
    ]
  },

  after: {
    all: [
      authorize({ adapter: 'feathers-mongoose' })
    ],
    find: [caseReportDecrypt()],
    get: [caseReportDecrypt()],
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
