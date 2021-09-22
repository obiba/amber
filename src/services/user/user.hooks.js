const Joi = require('@hapi/joi');
const validate = require('@feathers-plus/validate-joi');

const checkPermissions = require('feathers-permissions');
const { authenticate } = require('@feathersjs/authentication').hooks;
const { setField } = require('feathers-authentication-hooks');
const verifyHooks = require('feathers-authentication-management').hooks;
const accountService = require('../auth-management/notifier');

const allowAnonymous = require('../../hooks/allow-anonymous');
const processRegister = require('../../hooks/process-register');

const {
  disallow,
  discard,
  iff,
  isProvider,
  preventChanges,
} = require('feathers-hooks-common');

const {
  hashPassword,
  protect,
} = require('@feathersjs/authentication-local').hooks;

const firstname = Joi.string()
  .trim()
  .min(2)
  .max(30)
  .pattern(new RegExp('^[a-zA-Z0-9 ]{2,30}$'))
  .required();

const lastname = Joi.string()
  .trim()
  .min(2)
  .max(30)
  .pattern(new RegExp('^[a-zA-Z0-9 ]{2,30}$'))
  .required();

const password = Joi.string().trim().min(2).max(30).required();

const email = Joi.string().email({
  minDomainSegments: 2,
  //tlds: { allow: ['com','org'] },
});
const institution = Joi.string()
  .trim()
  .min(2)
  .max(30)
  .pattern(new RegExp('^[a-zA-Z0-9 ]{2,30}$'));

const city = Joi.string()
  .trim()
  .min(2)
  .max(30)
  .pattern(new RegExp('^[a-zA-Z0-9 ]{2,30}$'));

const title = Joi.string()
  .trim()
  .min(2)
  .max(30)
  .pattern(new RegExp('^[a-zA-Z0-9 ]{2,30}$'));

const phone = Joi.string()
  .trim()
  .min(2)
  .max(30)
  .pattern(new RegExp('^[+0-9 ]{2,30}$'));

const permissions = Joi.array();

const schema = Joi.object().keys({
  firstname: firstname,
  lastname: lastname,
  email: email,
  password: password,
  permissions: permissions,
});

const updateSchema = Joi.object().keys({
  firstname: firstname,
  lastname: lastname,
  city: city,
  institution: institution,
  title: title,
  phone: phone,
});

const adminUpdateSchema = Joi.object().keys({
  firstname: firstname,
  lastname: lastname,
  city: city,
  institution: institution,
  title: title,
  phone: phone,
  permissions: permissions,
});

const joiOptions = { convert: true, abortEarly: false };

const searchQuery = require('../../hooks/search-query');

module.exports = {
  before: {
    all: [],
    find: [authenticate('jwt'), searchQuery()],
    get: [authenticate('jwt')],
    create: [
      allowAnonymous(),
      authenticate('jwt', 'anonymous'),
      processRegister(), 
      discard('token'), 
      validate.mongoose(schema, joiOptions), 
      hashPassword('password'), 
      verifyHooks.addVerification()
    ],
    update: [
      authenticate('jwt'),
      iff(
        isProvider('external'),
        preventChanges(
          true,
          'email',
          'isVerified',
          'verifyToken',
          'verifyShortToken',
          'verifyExpires',
          'verifyChanges',
          'resetToken',
          'resetShortToken',
          'resetExpires'
        ),
        iff(
          checkPermissions({
            roles: ['administrator'],
            field: 'permissions',
            error: false,
          }),
          validate.mongoose(adminUpdateSchema, joiOptions)
        ),
        iff((context) => !context.params.permitted, [
          setField({
            from: 'params.user._id',
            as: 'params.query._id',
          }),
          validate.mongoose(updateSchema, joiOptions),
        ]),
        hashPassword('password')
      ),
    ],
    patch: [
      authenticate('jwt'),
      iff(
        isProvider('external'),
        preventChanges(
          true,
          'email',
          'isVerified',
          'verifyToken',
          'verifyShortToken',
          'verifyExpires',
          'verifyChanges',
          'resetToken',
          'resetShortToken',
          'resetExpires'
        ),
        iff(
          checkPermissions({
            roles: ['administrator'],
            field: 'permissions',
            error: false,
          }),
          validate.mongoose(adminUpdateSchema, joiOptions)
        ),
        iff((context) => !context.params.permitted, [
          setField({
            from: 'params.user._id',
            as: 'params.query._id',
          }),
          validate.mongoose(updateSchema, joiOptions),
        ]),
        hashPassword('password')
      ),
    ],
    remove: [
      authenticate('jwt'),
      checkPermissions({
        roles: ['administrator'],
        field: 'permissions',
      })
    ],
  },

  after: {
    all: [
      protect(
        'password',
        'verifyToken',
        'updatedAt',
        'createdAt',
        'verifyShortToken',
        'verifyExpires',
        'resetToken',
        'resetExpires',
        'verifyChanges',
        '__v'
      ),
    ],
    find: [],
    get: [],
    create: [
      (context) => {
        accountService(context.app).notifier(
          'resendVerifySignup',
          context.data
        );
      },
      verifyHooks.removeVerification(),
    ],
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
