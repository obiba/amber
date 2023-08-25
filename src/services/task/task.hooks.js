const { authenticate } = require('@feathersjs/authentication').hooks;

const allowApiKey = require('../../hooks/allow-api-key');
const participantsTaskCreated = require('../../hooks/participants-task-created');

module.exports = {
  before: {
    all: [
      allowApiKey(),
      authenticate('jwt', 'apiKey')
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
    create: [participantsTaskCreated()],
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
