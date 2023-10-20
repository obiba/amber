const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl').hooks;
const { defineAbilitiesFor } = require('./interview.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const searchQuery = require('../../hooks/search-query');
const interviewCreate = require('../../hooks/interview-create');
const interviewCompleted = require('../../hooks/interview-completed');
const interviewEncrypt = require('../../hooks/interview-encrypt');
const interviewDecrypt = require('../../hooks/interview-decrypt');

const interviewAuthz = require('../../hooks/interview-authz');

const interviewReopened = require('../../hooks/interview-reopened');

module.exports = {
  before: {
    all: [authenticate('jwt'), makeAbilities(defineAbilitiesFor), interviewAuthz()],
    find: [
      searchQuery(),
      authorize({ adapter: 'feathers-mongoose' })
    ],
    get: [
      authorize({ adapter: 'feathers-mongoose' })
    ],
    create: [
      authorize({ adapter: 'feathers-mongoose' }),
      interviewCreate(),
      interviewEncrypt()
    ],
    update: [
      authorize({ adapter: 'feathers-mongoose' }),
      interviewEncrypt(),
      interviewReopened()
    ],
    patch: [
      authorize({ adapter: 'feathers-mongoose' }),
      interviewEncrypt(),
      interviewReopened()
    ],
    remove: [
      authorize({ adapter: 'feathers-mongoose' })
    ]
  },

  after: {
    all: [],
    find: [interviewDecrypt()],
    get: [interviewDecrypt()],
    create: [interviewDecrypt()],
    update: [
      interviewDecrypt(),
      interviewCompleted()
    ],
    patch: [
      interviewDecrypt(),
      interviewCompleted()
    ],
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
