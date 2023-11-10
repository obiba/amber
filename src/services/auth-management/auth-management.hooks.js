const userPasswordCheck = require('../../hooks/user-password-check');

const userTotp2FaReset = require('../../hooks/user-totp2fa-reset');

const { protect } = require('@feathersjs/authentication-local').hooks;

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
    all: [
      protect(
        'password',
        'totp2faSecret',
        'totp2faRequired',
        'totp2faEnabled',
        'otp',
        'updatedAt',
        'createdAt',
        'verifyToken',
        'verifyShortToken',
        'verifyExpires',
        'resetToken',
        'resetExpires',
        'verifyChanges',
        'firstname',
        'lastname',
        'clientId',
        'isVerified',
        'role',
        'permissions',
        'language',
        '_id',
        '__v'
      )
    ],
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
