const validate = require('../../utils/validate-joi');
const { userRegisterSchema, userAdminCreateSchema, userAdminUpdateSchema } = require('../../schemas/user.schema');
const { joiOptions } = require('../../schemas/common');

const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl');

const verifyHooks = require('feathers-authentication-management').hooks;
const accountService = require('../auth-management/notifier');
const { defineAbilitiesFor } = require('./user.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const allowAnonymous = require('../../hooks/allow-anonymous');
const isAnonymous = require('../../hooks/is-anonymous');
const processRegister = require('../../hooks/process-register');
const searchQuery = require('../../hooks/search-query');
const addUserToGroupDomain = require('../../hooks/user-add-to-group-domain');
const userDeleteFromGroups = require('../../hooks/user-delete-from-groups');
const checkUpdateUser = require('../../hooks/check-update-user');

const { hashPassword } = require('../../utils/password-hasher');

const {
  discard,
  iff,
  isProvider,
  preventChanges,
} = require('feathers-hooks-common');

const {
  protect,
} = require('@feathersjs/authentication-local').hooks;

const userDeleteFromPermissions = require('../../hooks/user-delete-from-permissions');
const userSignupNotifyAdmin = require('../../hooks/user-signup-notify-admin');

const userSanitize = require('../../hooks/user-sanitize');

const userTotp2Fa = require('../../hooks/user-totp2fa');

const passwordHasher = async context => {
  if (context.data && context.data.password) {
    context.data.password = await hashPassword(context.data.password);
  }
  return context;
};

module.exports = {
  before: {
    all: [],
    find: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor),
      searchQuery(),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    get: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    create: [
      allowAnonymous(),
      authenticate('jwt', 'anonymous'),
      makeAbilities(defineAbilitiesFor),
      processRegister(),
      discard('token'),
      userSanitize(),
      iff(
        isAnonymous(),
        validate.mongoose(userRegisterSchema, joiOptions))
        .else(
          validate.mongoose(userAdminCreateSchema, joiOptions)),
      passwordHasher,
      verifyHooks.addVerification(),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    update: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor),
      checkUpdateUser(),
      userSanitize(),
      iff(
        isProvider('external'),
        preventChanges(
          true,
          'email',
          'lastLoggedIn',
          'isVerified',
          'verifyToken',
          'verifyShortToken',
          'verifyExpires',
          'verifyChanges',
          'resetToken',
          'resetShortToken',
          'resetExpires'
        ),
        validate.mongoose(userAdminUpdateSchema, joiOptions),
        passwordHasher
      ),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    patch: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor),
      checkUpdateUser(),
      userSanitize(),
      iff(
        isProvider('external'),
        preventChanges(
          true,
          'email',
          'lastLoggedIn',
          'isVerified',
          'verifyToken',
          'verifyShortToken',
          'verifyExpires',
          'verifyChanges',
          'resetToken',
          'resetShortToken',
          'resetExpires'
        ),
        validate.mongoose(userAdminUpdateSchema, joiOptions),
        passwordHasher
      ),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    remove: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
  },

  after: {
    all: [
      userTotp2Fa(),
      protect(
        'password',
        'verifyToken',
        'totp2faSecret',
        'updatedAt',
        'createdAt',
        'verifyShortToken',
        'verifyExpires',
        'resetToken',
        'resetExpires',
        'verifyChanges',
        '__v'
      )
    ],
    find: [
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    get: [
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    create: [(context) => {
      accountService(context.app).notifier(
        'resendVerifySignup',
        context.data);
    }, verifyHooks.removeVerification(),
    addUserToGroupDomain(),
    userSignupNotifyAdmin()],
    update: [
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    patch: [
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    remove: [
      authorize({ adapter: '@feathersjs/mongodb' }),
      userDeleteFromGroups(),
      userDeleteFromPermissions()
    ],
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
