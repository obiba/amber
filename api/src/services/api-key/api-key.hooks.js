const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl');
const { hooks: schemaHooks } = require('@feathersjs/schema');
const { defineAbilitiesFor } = require('./api-key.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const searchQuery = require('../../hooks/search-query');
const apiKeyGenerate = require('../../hooks/api-key-generate');
const { apiKeyDataResolver, apiKeyQueryResolver } = require('./api-key.resolvers');

const validate = require('../../utils/validate-joi');
const { apiKeyCreateSchema, apiKeyPatchSchema } = require('../../schemas/api-key.schema');
const { joiOptions } = require('../../schemas/common');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [
      searchQuery(),
      schemaHooks.resolveQuery(apiKeyQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    get: [
      schemaHooks.resolveQuery(apiKeyQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    create: [
      validate.mongoose(apiKeyCreateSchema, joiOptions),
      schemaHooks.resolveData(apiKeyDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' }),
      apiKeyGenerate()
    ],
    patch: [
      validate.mongoose(apiKeyPatchSchema, joiOptions),
      schemaHooks.resolveData(apiKeyDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' }),
      apiKeyGenerate()
    ],
    remove: [
      schemaHooks.resolveQuery(apiKeyQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ]
  },

  after: {
    all: [
      authorize({ adapter: '@feathersjs/mongodb' }),
      apiKeyGenerate()
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
