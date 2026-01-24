const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl').hooks;
const { defineAbilitiesFor } = require('./campaign.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const campaignCreate = require('../../hooks/campaign-create');
const searchQuery = require('../../hooks/search-query');
const campaignRemoveParticipants = require('../../hooks/campaign-remove-participants');

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
      campaignCreate(),
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
      campaignRemoveParticipants()
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
