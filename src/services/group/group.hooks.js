const { authenticate } = require('@feathersjs/authentication').hooks;
const searchQuery = require('../../hooks/search-query');

module.exports = {
  before: {
    all: [ authenticate('jwt') ],
    find: [
      searchQuery()
    ],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
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
