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
      authorize({ adapter: 'mongodb' })
    ],
    get: [
      authorize({ adapter: 'mongodb' })
    ],
    create: [
      authorize({ adapter: 'mongodb' }),
      interviewDesignCreate(),
      interviewDesignValidate()
    ],
    update: [
      authorize({ adapter: 'mongodb' }),
      interviewDesignValidate()
    ],
    patch: [
      authorize({ adapter: 'mongodb' }),
      interviewDesignValidate()
    ],
    remove: [
      authorize({ adapter: 'mongodb' }),
      interviewDesignRemoveCampaigns()
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
