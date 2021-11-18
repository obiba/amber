const { authenticate } = require('@feathersjs/authentication').hooks;

const createForm = require('../../hooks/create-form');
const searchQuery = require('../../hooks/search-query');
const formAddToStudy = require('../../hooks/form-add-to-study');
const formRemoveFromStudy = require('../../hooks/form-remove-from-study');

module.exports = {
  before: {
    all: [ authenticate('jwt') ],
    find: [
      searchQuery()
    ],
    get: [],
    create: [
      createForm()
    ],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      formAddToStudy()
    ],
    update: [],
    patch: [],
    remove: [
      formRemoveFromStudy()
    ]
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
