const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl');
const { hooks: schemaHooks } = require('@feathersjs/schema');
const { defineAbilitiesFor } = require('./study.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const searchQuery = require('../../hooks/search-query');
const studyRemoveForms = require('../../hooks/study-remove-forms');
const { studyDataResolver, studyQueryResolver } = require('./study.resolvers');

const validate = require('../../utils/validate-joi');
const { studyCreateSchema, studyPatchSchema } = require('../../schemas/study.schema');
const { joiOptions } = require('../../schemas/common');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [
      searchQuery(),
      schemaHooks.resolveQuery(studyQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    get: [
      schemaHooks.resolveQuery(studyQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    create: [
      validate.mongoose(studyCreateSchema, joiOptions),
      schemaHooks.resolveData(studyDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    update: [
      validate.mongoose(studyCreateSchema, joiOptions),
      schemaHooks.resolveData(studyDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    patch: [
      validate.mongoose(studyPatchSchema, joiOptions),
      schemaHooks.resolveData(studyDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    remove: [
      schemaHooks.resolveQuery(studyQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' }),
      studyRemoveForms()
    ]
  },

  after: {
    all: [
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [
    ]
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
