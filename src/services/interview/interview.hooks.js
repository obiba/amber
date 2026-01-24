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

const interviewParticipantValidity = require('../../hooks/interview-participant-validity');

const interviewSearch = require('../../hooks/interview-search');

module.exports = {
  before: {
    all: [authenticate('jwt'), makeAbilities(defineAbilitiesFor), interviewAuthz()],
    find: [
      searchQuery(),
      authorize({ adapter: '@feathersjs/mongodb' }),
      interviewSearch()
    ],
    get: [
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    create: [
      authorize({ adapter: '@feathersjs/mongodb' }),
      interviewCreate(),
      interviewEncrypt()
    ],
    update: [
      authorize({ adapter: '@feathersjs/mongodb' }),
      interviewEncrypt(),
      interviewReopened()
    ],
    patch: [
      authorize({ adapter: '@feathersjs/mongodb' }),
      interviewEncrypt(),
      interviewReopened()
    ],
    remove: [
      authorize({ adapter: '@feathersjs/mongodb' })
      // note: interviews can be orphans of their interview design
    ]
  },

  after: {
    all: [],
    find: [interviewDecrypt(), interviewParticipantValidity()],
    get: [interviewDecrypt(), interviewParticipantValidity()],
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
