const Joi = require('@hapi/joi');
const validate = require('@feathers-plus/validate-joi');

const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl').hooks;

//const { setField } = require('feathers-authentication-hooks');
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

const firstname = Joi.string()
  .trim()
  .min(2)
  .max(30)
  .required();

const lastname = Joi.string()
  .trim()
  .min(2)
  .max(30)
  .required();

const language = Joi.string()
  .trim()
  .min(2)
  .max(5);

const strongPasswordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,64}$/;
const password = Joi.string().trim()
  .regex(strongPasswordRegex)
  .min(8)
  .max(64)
  .required();

const email = Joi.string()
  .email({
    minDomainSegments: 2,
    //tlds: { allow: ['com','org'] },
  })
  .required();

const institution = Joi.string()
  .trim()
  .min(2)
  .max(100);

const city = Joi.string()
  .trim()
  .min(2)
  .max(30);

const title = Joi.string()
  .trim()
  .min(2)
  .max(30);

const phone = Joi.string()
  .trim()
  .min(2)
  .max(30)
  .pattern(new RegExp('^[+0-9 ]{2,30}$'));

const permissions = Joi.array();

const role = Joi.string()
  .trim()
  .pattern(new RegExp('^(guest|interviewer|manager|administrator|inactive)$'));

const schema = Joi.object().keys({
  firstname: firstname,
  lastname: lastname,
  language: language,
  email: email,
  password: password,
  clientId: Joi.string().trim()
});

const adminCreateSchema = Joi.object().keys({
  firstname: firstname,
  lastname: lastname,
  language: language,
  email: email,
  password: password,
  permissions: permissions,
  role: role,
  city: city,
  institution: institution,
  title: title,
  phone: phone,
});

const adminUpdateSchema = Joi.object().keys({
  firstname: firstname,
  lastname: lastname,
  language: language,
  city: city,
  institution: institution,
  title: title,
  phone: phone,
  permissions: permissions,
  role: role,
  with2fa: Joi.boolean(),
  totp2faSecret: Joi.any(),
  totp2faRequired: Joi.boolean()
});

const joiOptions = { convert: true, abortEarly: false };

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
      authorize({ adapter: 'feathers-mongoose' })
    ],
    get: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor),
      authorize({ adapter: 'feathers-mongoose' })
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
        validate.mongoose(schema, joiOptions))
        .else(
          validate.mongoose(adminCreateSchema, joiOptions)),
      passwordHasher,
      verifyHooks.addVerification(),
      authorize({ adapter: 'feathers-mongoose' })
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
        validate.mongoose(adminUpdateSchema, joiOptions),
        passwordHasher
      ),
      authorize({ adapter: 'feathers-mongoose' })
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
        validate.mongoose(adminUpdateSchema, joiOptions),
        passwordHasher
      ),
      authorize({ adapter: 'feathers-mongoose' })
    ],
    remove: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor),
      authorize({ adapter: 'feathers-mongoose' })
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
      authorize({ adapter: 'feathers-mongoose' })
    ],
    get: [
      authorize({ adapter: 'feathers-mongoose' })
    ],
    create: [(context) => {
      accountService(context.app).notifier(
        'resendVerifySignup',
        context.data);
    }, verifyHooks.removeVerification(),
    addUserToGroupDomain(),
    userSignupNotifyAdmin()],
    update: [
      authorize({ adapter: 'feathers-mongoose' })
    ],
    patch: [
      authorize({ adapter: 'feathers-mongoose' })
    ],
    remove: [
      authorize({ adapter: 'feathers-mongoose' }),
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
