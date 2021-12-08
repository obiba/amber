const { authenticate } = require('@feathersjs/authentication').hooks;

const formCreate = require('../../hooks/form-create');
const searchQuery = require('../../hooks/search-query');
const formAddToStudy = require('../../hooks/form-add-to-study');
const formRemoveFromStudy = require('../../hooks/form-remove-from-study');

const formRemoveRevisions = require('../../hooks/form-remove-revisions');

module.exports = {
  before: {
    all: [ authenticate('jwt') ],
    find: [
      searchQuery()
    ],
    get: [],
    create: [
      formCreate()
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
      formRemoveFromStudy(),
      formRemoveRevisions()
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
