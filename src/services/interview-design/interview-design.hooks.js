const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl');
const { hooks: schemaHooks } = require('@feathersjs/schema');
const { defineAbilitiesFor } = require('./interview-design.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const interviewDesignCreate = require('../../hooks/interview-design-create');
const searchQuery = require('../../hooks/search-query');
const addUserGroupsToContext = require('../../hooks/user-add-groups-to-context');

const interviewDesignValidate = require('../../hooks/interview-design-validate');

const interviewDesignRemoveCampaigns = require('../../hooks/interview-design-remove-campaigns');
const { interviewDesignDataResolver, interviewDesignQueryResolver } = require('./interview-design.resolvers');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
      addUserGroupsToContext(),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [
      searchQuery(),
      schemaHooks.resolveQuery(interviewDesignQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    get: [
      schemaHooks.resolveQuery(interviewDesignQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    create: [
      schemaHooks.resolveData(interviewDesignDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' }),
      interviewDesignCreate(),
      interviewDesignValidate()
    ],
    update: [
      schemaHooks.resolveData(interviewDesignDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' }),
      interviewDesignValidate()
    ],
    patch: [
      schemaHooks.resolveData(interviewDesignDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' }),
      interviewDesignValidate()
    ],
    remove: [
      authorize({ adapter: '@feathersjs/mongodb' }),
      interviewDesignRemoveCampaigns()
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
