const Joi = require('@hapi/joi');
const validate = require('@feathers-plus/validate-joi');

const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl').hooks;

const { setField } = require('feathers-authentication-hooks');
const verifyHooks = require('feathers-authentication-management').hooks;
const accountService = require('../auth-management/notifier');

const allowAnonymous = require('../../hooks/allow-anonymous');
const processRegister = require('../../hooks/process-register');

const {
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

const email = Joi.string()
  .email({
    minDomainSegments: 2,
    //tlds: { allow: ['com','org'] },
  })
  .required();

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

const role = Joi.string()
  .trim()
  .pattern(new RegExp('^(guest|interviewer|manager|administrator|inactive)$'));

const schema = Joi.object().keys({
  firstname: firstname,
  lastname: lastname,
  email: email,
  password: password,
  permissions: permissions,
  role: role
});

/*const updateSchema = Joi.object().keys({
  firstname: firstname,
  lastname: lastname,
  city: city,
  institution: institution,
  title: title,
  phone: phone,
});*/

const adminCreateSchema = Joi.object().keys({
  firstname: firstname,
  lastname: lastname,
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
  city: city,
  institution: institution,
  title: title,
  phone: phone,
  permissions: permissions,
  role: role,
});

const joiOptions = { convert: true, abortEarly: false };

const searchQuery = require('../../hooks/search-query');

module.exports = {
  before: {
    all: [],
    find: [
      authenticate('jwt'), 
      searchQuery(),
      authorize({ adapter: 'feathers-mongoose' })
    ],
    get: [
      authenticate('jwt'),
      authorize({ adapter: 'feathers-mongoose' })
    ],
    create: [
      allowAnonymous(),
      authenticate('jwt', 'anonymous'),
      processRegister(), 
      discard('token'), 
      iff(
        context => context.params.authentication && context.params.authentication.strategy === 'anonymous',
        validate.mongoose(schema, joiOptions),
        validate.mongoose(adminCreateSchema, joiOptions)
      ),
      hashPassword('password'), 
      verifyHooks.addVerification(),
      authorize({ adapter: 'feathers-mongoose' })
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
        // TODO
        validate.mongoose(adminUpdateSchema, joiOptions),
        /*iff((context) => !context.params.permitted, [
          setField({
            from: 'params.user._id',
            as: 'params.query._id',
          }),
          validate.mongoose(updateSchema, joiOptions),
        ]),*/
        hashPassword('password')
      ),
      authorize({ adapter: 'feathers-mongoose' })
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
        // TODO
        validate.mongoose(adminUpdateSchema, joiOptions),
        /*iff((context) => !context.params.permitted, [
          setField({
            from: 'params.user._id',
            as: 'params.query._id',
          }),
          validate.mongoose(updateSchema, joiOptions),
        ]),*/
        hashPassword('password')
      ),
      authorize({ adapter: 'feathers-mongoose' })
    ],
    remove: [
      authenticate('jwt'),
      authorize({ adapter: 'feathers-mongoose' })
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
    find: [
      authorize({ adapter: 'feathers-mongoose' })
    ],
    get: [
      authorize({ adapter: 'feathers-mongoose' })
    ],
    create: [
      (context) => {
        accountService(context.app).notifier(
          'resendVerifySignup',
          context.data
        );
      },
      verifyHooks.removeVerification(),
    ],
    update: [
      authorize({ adapter: 'feathers-mongoose' })
    ],
    patch: [
      authorize({ adapter: 'feathers-mongoose' })
    ],
    remove: [
      authorize({ adapter: 'feathers-mongoose' })
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
