const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl');
const { hooks: schemaHooks } = require('@feathersjs/schema');
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
const { participantDataResolver, participantQueryResolver } = require('./participant.resolvers');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [
      searchQuery(),
      schemaHooks.resolveQuery(participantQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' }),
      participantSearch()
    ],
    get: [
      schemaHooks.resolveQuery(participantQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    create: [
      schemaHooks.resolveData(participantDataResolver),
      participantCreate(),
      authorize({ adapter: '@feathersjs/mongodb' }),
      participantEncrypt(),
      participantPasswordHash()
    ],
    update: [
      schemaHooks.resolveData(participantDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' }),
      participantEncrypt(),
      participantPasswordHash()
    ],
    patch: [
      schemaHooks.resolveData(participantDataResolver),
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
