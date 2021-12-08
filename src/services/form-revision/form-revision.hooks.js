const { authenticate } = require('@feathersjs/authentication').hooks;

const formRevisionCreate = require('../../hooks/form-revision-create');
const searchQuery = require('../../hooks/search-query');

module.exports = {
  before: {
    all: [ authenticate('jwt') ],
    find: [
      searchQuery()
    ],
    get: [],
    create: [
      formRevisionCreate()
    ],
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
