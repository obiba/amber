const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl').hooks;
const { defineAbilitiesFor } = require('./task.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const allowApiKey = require('../../hooks/allow-api-key');
const searchQuery = require('../../hooks/search-query');
const participantsTaskCreated = require('../../hooks/participants-task-created');

module.exports = {
  before: {
    all: [
      allowApiKey(),
      authenticate('jwt', 'apiKey'),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [
      searchQuery(),
      authorize({ adapter: 'feathers-mongoose' })
    ],
    get: [authorize({ adapter: 'feathers-mongoose' })],
    create: [authorize({ adapter: 'feathers-mongoose' })],
    update: [authorize({ adapter: 'feathers-mongoose' })],
    patch: [authorize({ adapter: 'feathers-mongoose' })],
    remove: [authorize({ adapter: 'feathers-mongoose' })]
  },

  after: {
    all: [authorize({ adapter: 'feathers-mongoose' })],
    find: [],
    get: [],
    create: [participantsTaskCreated()],
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
