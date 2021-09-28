// Application hooks that run for every service
const logActivity = require('./hooks/log-activity');
const authActivity = require('./hooks/auth-activity');

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
    all: [logActivity()],
    find: [],
    get: [],
    create: [authActivity()],
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
