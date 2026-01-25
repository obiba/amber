const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl');
const { hooks: schemaHooks } = require('@feathersjs/schema');
const { defineAbilitiesFor } = require('./case-report.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const caseReportCreate = require('../../hooks/case-report-create');
const searchQuery = require('../../hooks/search-query');
const caseReportEncrypt = require('../../hooks/case-report-encrypt');
const caseReportDecrypt = require('../../hooks/case-report-decrypt');
const { caseReportDataResolver, caseReportQueryResolver } = require('./case-report.resolvers');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [
      searchQuery(),
      schemaHooks.resolveQuery(caseReportQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    get: [
      schemaHooks.resolveQuery(caseReportQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    create: [
      schemaHooks.resolveData(caseReportDataResolver),
      caseReportCreate(),
      authorize({ adapter: '@feathersjs/mongodb' }),
      caseReportEncrypt()
    ],
    update: [
      schemaHooks.resolveData(caseReportDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' }),
      caseReportEncrypt()
    ],
    patch: [
      schemaHooks.resolveData(caseReportDataResolver),
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
