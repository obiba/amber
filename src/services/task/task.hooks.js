const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl');
const { defineAbilitiesFor } = require('./task.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const allowApiKey = require('../../hooks/allow-api-key');
const searchQuery = require('../../hooks/search-query');
const taskCreated = require('../../hooks/task-created');

const validate = require('../../utils/validate-joi');
const { taskCreateSchema, taskPatchSchema } = require('../../schemas/task.schema');
const { joiOptions } = require('../../schemas/common');

module.exports = {
  before: {
    all: [
      allowApiKey(),
      authenticate('jwt', 'apiKey'),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [
      searchQuery(),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    get: [authorize({ adapter: '@feathersjs/mongodb' })],
    create: [
      validate.mongoose(taskCreateSchema, joiOptions),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    update: [
      validate.mongoose(taskCreateSchema, joiOptions),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    patch: [
      validate.mongoose(taskPatchSchema, joiOptions),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    remove: [authorize({ adapter: '@feathersjs/mongodb' })]
  },

  after: {
    all: [authorize({ adapter: '@feathersjs/mongodb' })],
    find: [],
    get: [],
    create: [taskCreated()],
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
