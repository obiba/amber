const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl').hooks;
const { defineAbilitiesFor } = require('./case-report-form.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const caseReportFormCreate = require('../../hooks/case-report-form-create');
const addUserGroupsToContext = require('../../hooks/user-add-groups-to-context');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
      addUserGroupsToContext(),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    get: [
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    create: [
      caseReportFormCreate(),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    update: [
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    patch: [
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
