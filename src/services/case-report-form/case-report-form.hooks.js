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
      authorize({ adapter: 'mongodb' })
    ],
    get: [
      authorize({ adapter: 'mongodb' })
    ],
    create: [
      caseReportFormCreate(),
      authorize({ adapter: 'mongodb' })
    ],
    update: [
      authorize({ adapter: 'mongodb' })
    ],
    patch: [
      authorize({ adapter: 'mongodb' })
    ],
    remove: [
      authorize({ adapter: 'mongodb' })
      // note: case reports can be orphans of their CRF
    ]
  },

  after: {
    all: [
      authorize({ adapter: 'mongodb' })
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
