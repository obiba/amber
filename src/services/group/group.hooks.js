const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl').hooks;
const { defineAbilitiesFor } = require('./group.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const searchQuery = require('../../hooks/search-query');
const groupDeleteFromPermissions = require('../../hooks/group-delete-from-permissions');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [
      searchQuery(),
      authorize({ adapter: 'feathers-mongoose' })
    ],
    get: [
      authorize({ adapter: 'feathers-mongoose' })
    ],
    create: [
      authorize({ adapter: 'feathers-mongoose' })
    ],
    update: [
      authorize({ adapter: 'feathers-mongoose' })
    ],
    patch: [
      authorize({ adapter: 'feathers-mongoose' })
    ],
    remove: [
      authorize({ adapter: 'feathers-mongoose' })
    ]
  },

  after: {
    all: [
      authorize({ adapter: 'feathers-mongoose' })
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
