const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl');
const { hooks: schemaHooks } = require('@feathersjs/schema');
const { defineAbilitiesFor } = require('./interview.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const searchQuery = require('../../hooks/search-query');
const interviewCreate = require('../../hooks/interview-create');
const interviewCompleted = require('../../hooks/interview-completed');
const interviewEncrypt = require('../../hooks/interview-encrypt');
const interviewDecrypt = require('../../hooks/interview-decrypt');

const interviewAuthz = require('../../hooks/interview-authz');

const interviewReopened = require('../../hooks/interview-reopened');

const interviewParticipantValidity = require('../../hooks/interview-participant-validity');

const interviewSearch = require('../../hooks/interview-search');
const { interviewDataResolver, interviewQueryResolver } = require('./interview.resolvers');

const validate = require('../../utils/validate-joi');
const { interviewCreateSchema, interviewPatchSchema } = require('../../schemas/interview.schema');
const { joiOptions } = require('../../schemas/common');

module.exports = {
  before: {
    all: [authenticate('jwt'), makeAbilities(defineAbilitiesFor), interviewAuthz()],
    find: [
      searchQuery(),
      schemaHooks.resolveQuery(interviewQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' }),
      interviewSearch()
    ],
    get: [
      schemaHooks.resolveQuery(interviewQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    create: [
      validate.mongoose(interviewCreateSchema, joiOptions),
      schemaHooks.resolveData(interviewDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' }),
      interviewCreate(),
      interviewEncrypt()
    ],
    update: [
      validate.mongoose(interviewCreateSchema, joiOptions),
      schemaHooks.resolveData(interviewDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' }),
      interviewEncrypt(),
      interviewReopened()
    ],
    patch: [
      validate.mongoose(interviewPatchSchema, joiOptions),
      schemaHooks.resolveData(interviewDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' }),
      interviewEncrypt(),
      interviewReopened()
    ],
    remove: [
      authorize({ adapter: '@feathersjs/mongodb' })
    ]
  },

  after: {
    all: [],
    find: [interviewDecrypt(), interviewParticipantValidity()],
    get: [interviewDecrypt(), interviewParticipantValidity()],
    create: [interviewDecrypt()],
    update: [
      interviewDecrypt(),
      interviewCompleted()
    ],
    patch: [
      interviewDecrypt(),
      interviewCompleted()
    ],
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
