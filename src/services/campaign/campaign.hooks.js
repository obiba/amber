const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl');
const { hooks: schemaHooks } = require('@feathersjs/schema');
const { defineAbilitiesFor } = require('./campaign.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const campaignCreate = require('../../hooks/campaign-create');
const searchQuery = require('../../hooks/search-query');
const campaignRemoveParticipants = require('../../hooks/campaign-remove-participants');
const { campaignDataResolver, campaignQueryResolver } = require('./campaign.resolvers');

const validate = require('../../utils/validate-joi');
const { campaignCreateSchema, campaignPatchSchema } = require('../../schemas/campaign.schema');
const { joiOptions } = require('../../schemas/common');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [
      searchQuery(),
      schemaHooks.resolveQuery(campaignQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    get: [
      schemaHooks.resolveQuery(campaignQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    create: [
      validate.mongoose(campaignCreateSchema, joiOptions),
      schemaHooks.resolveData(campaignDataResolver),
      campaignCreate(),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    update: [
      validate.mongoose(campaignCreateSchema, joiOptions),
      schemaHooks.resolveData(campaignDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    patch: [
      validate.mongoose(campaignPatchSchema, joiOptions),
      schemaHooks.resolveData(campaignDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    remove: [
      schemaHooks.resolveQuery(campaignQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' }),
      campaignRemoveParticipants()
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
