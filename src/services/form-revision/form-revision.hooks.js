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
      authorize({ adapter: 'mongodb' })
    ],
    get: [
      authorize({ adapter: 'mongodb' })
    ],
    create: [
      formRevisionCreate(),
      authorize({ adapter: 'mongodb' })
    ],
    update: [
      authorize({ adapter: 'mongodb' })
    ],
    patch: [
      authorize({ adapter: 'mongodb' })
    ],
    remove: [
      authorize({ adapter: 'mongodb' }),
      formRevisionCheckRemove()
    ]
  },

  after: {
    all: [
      authorize({ adapter: 'mongodb' })
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
