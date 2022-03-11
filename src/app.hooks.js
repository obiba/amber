// Application hooks that run for every service
const logActivity = require('./hooks/log-activity');

const userActivity = require('./hooks/user-activity');

module.exports = {
  before: {
    all: [logActivity()],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [logActivity(), userActivity()],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [logActivity()],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
