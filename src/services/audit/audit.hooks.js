const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl');
const { hooks: schemaHooks } = require('@feathersjs/schema');

const { defineAbilitiesFor } = require('./audit.abilities');

const makeAbilities = require('../../hooks/make-abilities');

const auditCreateInternal = require('../../hooks/audit-create-internal');
const { auditDataResolver, auditQueryResolver } = require('./audit.resolvers');

const validate = require('../../utils/validate-joi');
const { auditCreateSchema, auditPatchSchema } = require('../../schemas/audit.schema');
const { joiOptions } = require('../../schemas/common');

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
      validate.mongoose(auditCreateSchema, joiOptions),
      schemaHooks.resolveData(auditDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' }),
      auditCreateInternal()
    ],
    update: [
      validate.mongoose(auditCreateSchema, joiOptions),
      schemaHooks.resolveData(auditDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    patch: [
      validate.mongoose(auditPatchSchema, joiOptions),
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
