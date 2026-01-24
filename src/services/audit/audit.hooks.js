const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl');

const { defineAbilitiesFor } = require('./audit.abilities');

const makeAbilities = require('../../hooks/make-abilities');

const auditCreateInternal = require('../../hooks/audit-create-internal');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [authorize({ adapter: '@feathersjs/mongodb' })],
    get: [authorize({ adapter: '@feathersjs/mongodb' })],
    create: [authorize({ adapter: '@feathersjs/mongodb' }), auditCreateInternal()],
    update: [authorize({ adapter: '@feathersjs/mongodb' })],
    patch: [authorize({ adapter: '@feathersjs/mongodb' })],
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
