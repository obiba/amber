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

const validate = require('../../utils/validate-joi');
const { interviewDesignCreateSchema, interviewDesignPatchSchema } = require('../../schemas/interview-design.schema');
const { joiOptions } = require('../../schemas/common');

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
      validate.mongoose(interviewDesignCreateSchema, joiOptions),
      schemaHooks.resolveData(interviewDesignDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' }),
      interviewDesignCreate(),
      interviewDesignValidate()
    ],
    update: [
      validate.mongoose(interviewDesignCreateSchema, joiOptions),
      schemaHooks.resolveData(interviewDesignDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' }),
      interviewDesignValidate()
    ],
    patch: [
      validate.mongoose(interviewDesignPatchSchema, joiOptions),
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
