const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl').hooks;
const { defineAbilitiesFor } = require('./form-revision.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const formRevisionCreate = require('../../hooks/form-revision-create');
const searchQuery = require('../../hooks/search-query');

const formRevisionCheckRemove = require('../../hooks/form-revision-check-remove');

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
      formRevisionCreate(),
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
      formRevisionCheckRemove()
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
