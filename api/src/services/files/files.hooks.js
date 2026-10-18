const { authenticate } = require('@feathersjs/authentication').hooks;
const allowParticipant = require('../../hooks/allow-participant');
const allowWalkInParticipant = require('../../hooks/allow-walk-in-participant');
const filesAudit = require('../../hooks/files-audit');

module.exports = {
  before: {
    all: [
      allowParticipant(),
      allowWalkInParticipant(),
      authenticate('jwt', 'participant', 'campaign')
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
    get: [filesAudit()],
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
