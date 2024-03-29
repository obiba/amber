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
      authorize({ adapter: 'feathers-mongoose' })
    ],
    get: [
      authorize({ adapter: 'feathers-mongoose' })
    ],
    create: [
      caseReportFormCreate(),
      authorize({ adapter: 'feathers-mongoose' })
    ],
    update: [
      authorize({ adapter: 'feathers-mongoose' })
    ],
    patch: [
      authorize({ adapter: 'feathers-mongoose' })
    ],
    remove: [
      authorize({ adapter: 'feathers-mongoose' })
      // note: case reports can be orphans of their CRF
    ]
  },

  after: {
    all: [
      authorize({ adapter: 'feathers-mongoose' })
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
