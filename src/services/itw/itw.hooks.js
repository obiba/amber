const { authenticate } = require('@feathersjs/authentication').hooks;
const allowParticipant = require('../../hooks/allow-participant');

module.exports = {
  before: {
    all: [
      allowParticipant(),
      authenticate('jwt', 'participant')
    ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
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
