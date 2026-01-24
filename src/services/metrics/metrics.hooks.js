const { authenticate } = require('@feathersjs/authentication').hooks;

const { authorize } = require('feathers-casl').hooks;
const { defineAbilitiesFor } = require('./metrics.abilities');

const makeAbilities = require('../../hooks/make-abilities');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [ authorize({ adapter: '@feathersjs/mongodb' }) ],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [ authorize({ adapter: '@feathersjs/mongodb' }) ],
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
