const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl').hooks;
const { defineAbilitiesFor } = require('./participant.abilities');


const { protect } = require('@feathersjs/authentication-local').hooks;
const makeAbilities = require('../../hooks/make-abilities');
const searchQuery = require('../../hooks/search-query');
const participantCreate = require('../../hooks/participant-create');
const participantEncrypt = require('../../hooks/participant-encrypt');
const participantDecrypt = require('../../hooks/participant-decrypt');
const participantInterviewerAuthz = require('../../hooks/participant-interviewer-authz');

const participantPasswordHash = require('../../hooks/participant-password-hash');

const participantValidity = require('../../hooks/participant-validity');

const participantSearch = require('../../hooks/participant-search');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [
      searchQuery(),
      authorize({ adapter: '@feathersjs/mongodb' }),
      participantSearch()
    ],
    get: [
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    create: [
      participantCreate(),
      authorize({ adapter: '@feathersjs/mongodb' }),
      participantEncrypt(),
      participantPasswordHash()
    ],
    update: [
      authorize({ adapter: '@feathersjs/mongodb' }),
      participantEncrypt(),
      participantPasswordHash()
    ],
    patch: [
      authorize({ adapter: '@feathersjs/mongodb' }),
      participantEncrypt(),
      participantPasswordHash()
    ],
    remove: [
      authorize({ adapter: '@feathersjs/mongodb' })
    ]
  },

  after: {
    all: [
      authorize({ adapter: '@feathersjs/mongodb' }),
      participantInterviewerAuthz(),
      protect(
        'password',
        'updatedAt',
        'createdAt',
        '__v'
      )
    ],
    find: [participantDecrypt(), participantValidity()],
    get: [participantDecrypt(), participantValidity()],
    create: [participantDecrypt()],
    update: [participantDecrypt()],
    patch: [participantDecrypt()],
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
