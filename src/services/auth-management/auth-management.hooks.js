const userPasswordCheck = require('../../hooks/user-password-check');

const userTotp2FaReset = require('../../hooks/user-totp2fa-reset');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [userPasswordCheck()],
    update: [],
    patch: [],
    remove: [],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [userTotp2FaReset()],
    update: [],
    patch: [],
    remove: [],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
};
