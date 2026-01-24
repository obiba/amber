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
      authorize({ adapter: 'mongodb' })
    ],
    get: [
      authorize({ adapter: 'mongodb' })
    ],
    create: [
      caseReportCreate(),
      authorize({ adapter: 'mongodb' }),
      caseReportEncrypt()
    ],
    update: [
      authorize({ adapter: 'mongodb' }),
      caseReportEncrypt()
    ],
    patch: [
      authorize({ adapter: 'mongodb' }),
      caseReportEncrypt()
    ],
    remove: [
      authorize({ adapter: 'mongodb' })
    ]
  },

  after: {
    all: [
      authorize({ adapter: 'mongodb' })
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
