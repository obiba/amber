const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl');
const { hooks: schemaHooks } = require('@feathersjs/schema');
const { defineAbilitiesFor } = require('./form.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const formCreate = require('../../hooks/form-create');
const searchQuery = require('../../hooks/search-query');
const formAddToStudy = require('../../hooks/form-add-to-study');
const formRemoveFromStudy = require('../../hooks/form-remove-from-study');
const formRemoveRevisions = require('../../hooks/form-remove-revisions');
const formCheckRemove = require('../../hooks/form-check-remove');
const { formDataResolver, formQueryResolver } = require('./form.resolvers');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [
      searchQuery(),
      schemaHooks.resolveQuery(formQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    get: [
      schemaHooks.resolveQuery(formQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    create: [
      schemaHooks.resolveData(formDataResolver),
      formCreate(),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    update: [
      schemaHooks.resolveData(formDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    patch: [
      schemaHooks.resolveData(formDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    remove: [
      authorize({ adapter: '@feathersjs/mongodb' }),
      formCheckRemove(), // check if the form has dependencies
      formRemoveRevisions(), // remove form revisions before removing the form
    ]
  },

  after: {
    all: [
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    find: [],
    get: [],
    create: [
      formAddToStudy()
    ],
    update: [],
    patch: [],
    remove: [
      formRemoveFromStudy()
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
