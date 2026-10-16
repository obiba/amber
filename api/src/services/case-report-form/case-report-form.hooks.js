const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl');
const { hooks: schemaHooks } = require('@feathersjs/schema');
const { defineAbilitiesFor } = require('./case-report-form.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const caseReportFormCreate = require('../../hooks/case-report-form-create');
const addUserGroupsToContext = require('../../hooks/user-add-groups-to-context');
const { caseReportFormDataResolver, caseReportFormQueryResolver } = require('./case-report-form.resolvers');

const validate = require('../../utils/validate-joi');
const { caseReportFormCreateSchema, caseReportFormPatchSchema } = require('../../schemas/case-report-form.schema');
const { joiOptions } = require('../../schemas/common');

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
      validate.mongoose(caseReportFormCreateSchema, joiOptions),
      schemaHooks.resolveData(caseReportFormDataResolver),
      caseReportFormCreate(),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    update: [
      validate.mongoose(caseReportFormCreateSchema, joiOptions),
      schemaHooks.resolveData(caseReportFormDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    patch: [
      validate.mongoose(caseReportFormPatchSchema, joiOptions),
      schemaHooks.resolveData(caseReportFormDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    remove: [
      schemaHooks.resolveQuery(caseReportFormQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
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
