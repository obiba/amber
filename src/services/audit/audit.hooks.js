const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl');
const { hooks: schemaHooks } = require('@feathersjs/schema');

const { defineAbilitiesFor } = require('./audit.abilities');

const makeAbilities = require('../../hooks/make-abilities');

const auditCreateInternal = require('../../hooks/audit-create-internal');
const { auditDataResolver, auditQueryResolver } = require('./audit.resolvers');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [
      schemaHooks.resolveQuery(auditQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    get: [
      schemaHooks.resolveQuery(auditQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    create: [
      schemaHooks.resolveData(auditDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' }),
      auditCreateInternal()
    ],
    update: [
      schemaHooks.resolveData(auditDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    patch: [
      schemaHooks.resolveData(auditDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    remove: [authorize({ adapter: '@feathersjs/mongodb' })]
  },

  after: {
    all: [authorize({ adapter: '@feathersjs/mongodb' })],
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
