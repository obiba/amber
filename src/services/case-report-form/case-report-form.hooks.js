const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl');
const { hooks: schemaHooks } = require('@feathersjs/schema');
const { defineAbilitiesFor } = require('./case-report-form.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const caseReportFormCreate = require('../../hooks/case-report-form-create');
const addUserGroupsToContext = require('../../hooks/user-add-groups-to-context');
const { caseReportFormDataResolver, caseReportFormQueryResolver } = require('./case-report-form.resolvers');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
      addUserGroupsToContext(),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [
      schemaHooks.resolveQuery(caseReportFormQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    get: [
      schemaHooks.resolveQuery(caseReportFormQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    create: [
      schemaHooks.resolveData(caseReportFormDataResolver),
      caseReportFormCreate(),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    update: [
      schemaHooks.resolveData(caseReportFormDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    patch: [
      schemaHooks.resolveData(caseReportFormDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    remove: [
      authorize({ adapter: '@feathersjs/mongodb' })
      // note: case reports can be orphans of their CRF
    ]
  },

  after: {
    all: [
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    find: [],
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
