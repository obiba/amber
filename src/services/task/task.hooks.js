const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl').hooks;
const { defineAbilitiesFor } = require('./task.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const allowApiKey = require('../../hooks/allow-api-key');
const searchQuery = require('../../hooks/search-query');
const taskCreated = require('../../hooks/task-created');

module.exports = {
  before: {
    all: [
      allowApiKey(),
      authenticate('jwt', 'apiKey'),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [
      searchQuery(),
      authorize({ adapter: 'mongodb' })
    ],
    get: [authorize({ adapter: 'mongodb' })],
    create: [authorize({ adapter: 'mongodb' })],
    update: [authorize({ adapter: 'mongodb' })],
    patch: [authorize({ adapter: 'mongodb' })],
    remove: [authorize({ adapter: 'mongodb' })]
  },

  after: {
    all: [authorize({ adapter: 'mongodb' })],
    find: [],
    get: [],
    create: [taskCreated()],
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
