const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl').hooks;

const { defineAbilitiesFor } = require('./audit.abilities');

const makeAbilities = require('../../hooks/make-abilities');

const auditCreateInternal = require('../../hooks/audit-create-internal');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [authorize({ adapter: 'mongodb' })],
    get: [authorize({ adapter: 'mongodb' })],
    create: [authorize({ adapter: 'mongodb' }), auditCreateInternal()],
    update: [authorize({ adapter: 'mongodb' })],
    patch: [authorize({ adapter: 'mongodb' })],
    remove: [authorize({ adapter: 'mongodb' })]
  },

  after: {
    all: [authorize({ adapter: 'mongodb' })],
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
