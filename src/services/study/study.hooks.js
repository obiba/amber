const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl').hooks;
const { defineAbilitiesFor } = require('./study.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const searchQuery = require('../../hooks/search-query');
const studyCreate = require('../../hooks/study-create');
const studyRemoveForms = require('../../hooks/study-remove-forms');

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
      studyCreate(),
      authorize({ adapter: 'feathers-mongoose' })
    ],
    update: [
      authorize({ adapter: 'feathers-mongoose' })
    ],
    patch: [
      authorize({ adapter: 'feathers-mongoose' })
    ],
    remove: [
      authorize({ adapter: 'feathers-mongoose' }),
      studyRemoveForms()
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
    remove: [
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
