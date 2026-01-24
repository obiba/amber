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
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    get: [
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    create: [
      studyCreate(),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    update: [
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    patch: [
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    remove: [
      authorize({ adapter: '@feathersjs/mongodb' }),
      studyRemoveForms()
    ]
  },

  after: {
    all: [
      authorize({ adapter: '@feathersjs/mongodb' })
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
