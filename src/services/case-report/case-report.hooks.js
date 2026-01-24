const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl');
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
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    get: [
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    create: [
      caseReportCreate(),
      authorize({ adapter: '@feathersjs/mongodb' }),
      caseReportEncrypt()
    ],
    update: [
      authorize({ adapter: '@feathersjs/mongodb' }),
      caseReportEncrypt()
    ],
    patch: [
      authorize({ adapter: '@feathersjs/mongodb' }),
      caseReportEncrypt()
    ],
    remove: [
      authorize({ adapter: '@feathersjs/mongodb' })
    ]
  },

  after: {
    all: [
      authorize({ adapter: '@feathersjs/mongodb' })
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
