const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl').hooks;
const { defineAbilitiesFor } = require('./form.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const formCreate = require('../../hooks/form-create');
const searchQuery = require('../../hooks/search-query');
const formAddToStudy = require('../../hooks/form-add-to-study');
const formRemoveFromStudy = require('../../hooks/form-remove-from-study');
const formRemoveRevisions = require('../../hooks/form-remove-revisions');
const formCheckRemove = require('../../hooks/form-check-remove');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [
      searchQuery(),
      authorize({ adapter: 'feathers-mongoose' })
    ],
    get: [
      authorize({ adapter: 'feathers-mongoose' })
    ],
    create: [
      formCreate(),
      authorize({ adapter: 'feathers-mongoose' })
    ],
    update: [
      authorize({ adapter: 'feathers-mongoose' })
    ],
    patch: [
      authorize({ adapter: 'feathers-mongoose' })
    ],
    remove: [
      authorize({ adapter: 'feathers-mongoose' }),
      formCheckRemove(), // check if the form has dependencies
      formRemoveRevisions(), // remove form revisions before removing the form
    ]
  },

  after: {
    all: [
      authorize({ adapter: 'feathers-mongoose' })
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
