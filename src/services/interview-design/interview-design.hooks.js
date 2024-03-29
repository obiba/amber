const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl').hooks;
const { defineAbilitiesFor } = require('./interview-design.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const interviewDesignCreate = require('../../hooks/interview-design-create');
const searchQuery = require('../../hooks/search-query');
const addUserGroupsToContext = require('../../hooks/user-add-groups-to-context');

const interviewDesignValidate = require('../../hooks/interview-design-validate');

const interviewDesignRemoveCampaigns = require('../../hooks/interview-design-remove-campaigns');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
      addUserGroupsToContext(),
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
      authorize({ adapter: 'feathers-mongoose' }),
      interviewDesignCreate(),
      interviewDesignValidate()
    ],
    update: [
      authorize({ adapter: 'feathers-mongoose' }),
      interviewDesignValidate()
    ],
    patch: [
      authorize({ adapter: 'feathers-mongoose' }),
      interviewDesignValidate()
    ],
    remove: [
      authorize({ adapter: 'feathers-mongoose' }),
      interviewDesignRemoveCampaigns()
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
