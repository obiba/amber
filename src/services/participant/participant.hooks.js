const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl').hooks;
const { defineAbilitiesFor } = require('./participant.abilities');


const { protect } = require('@feathersjs/authentication-local').hooks;
const makeAbilities = require('../../hooks/make-abilities');
const searchQuery = require('../../hooks/search-query');
const participantCreate = require('../../hooks/participant-create');
const participantEncrypt = require('../../hooks/participant-encrypt');
const participantDecrypt = require('../../hooks/participant-decrypt');

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
      participantCreate(),
      authorize({ adapter: 'feathers-mongoose' }),
      participantEncrypt()
    ],
    update: [
      authorize({ adapter: 'feathers-mongoose' }),
      participantEncrypt()
    ],
    patch: [
      authorize({ adapter: 'feathers-mongoose' }),
      participantEncrypt()
    ],
    remove: [
      authorize({ adapter: 'feathers-mongoose' })
    ]
  },

  after: {
    all: [
      authorize({ adapter: 'feathers-mongoose' }),
      protect(
        'password',
        'updatedAt',
        'createdAt',
        '__v'
      )
    ],
    find: [participantDecrypt()],
    get: [participantDecrypt()],
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
