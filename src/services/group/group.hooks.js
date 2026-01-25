const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl');
const { hooks: schemaHooks } = require('@feathersjs/schema');
const { defineAbilitiesFor } = require('./group.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const searchQuery = require('../../hooks/search-query');
const groupDeleteFromPermissions = require('../../hooks/group-delete-from-permissions');
const { groupDataResolver, groupQueryResolver } = require('./group.resolvers');

const validate = require('../../utils/validate-joi');
const { groupCreateSchema, groupPatchSchema } = require('../../schemas/group.schema');
const { joiOptions } = require('../../schemas/common');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [
      searchQuery(),
      schemaHooks.resolveQuery(groupQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    get: [
      schemaHooks.resolveQuery(groupQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    create: [
      validate.mongoose(groupCreateSchema, joiOptions),
      schemaHooks.resolveData(groupDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    update: [
      validate.mongoose(groupCreateSchema, joiOptions),
      schemaHooks.resolveData(groupDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    patch: [
      validate.mongoose(groupPatchSchema, joiOptions),
      schemaHooks.resolveData(groupDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    remove: [
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
    remove: [groupDeleteFromPermissions()]
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
