const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl');
const { hooks: schemaHooks } = require('@feathersjs/schema');
const { defineAbilitiesFor } = require('./form-revision.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const formRevisionCreate = require('../../hooks/form-revision-create');
const searchQuery = require('../../hooks/search-query');

const formRevisionCheckRemove = require('../../hooks/form-revision-check-remove');
const { formRevisionDataResolver, formRevisionQueryResolver } = require('./form-revision.resolvers');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [
      searchQuery(),
      schemaHooks.resolveQuery(formRevisionQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    get: [
      schemaHooks.resolveQuery(formRevisionQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    create: [
      schemaHooks.resolveData(formRevisionDataResolver),
      formRevisionCreate(),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    update: [
      schemaHooks.resolveData(formRevisionDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    patch: [
      schemaHooks.resolveData(formRevisionDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    remove: [
      authorize({ adapter: '@feathersjs/mongodb' }),
      formRevisionCheckRemove()
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
