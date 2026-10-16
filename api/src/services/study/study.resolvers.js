const { resolve } = require('@feathersjs/schema');
const { resolveQueryObjectId } = require('@feathersjs/mongodb');
const { resolveObjectIdArray, resolveCreatedBy, resolveUpdatedBy } = require('../../resolvers');

/**
 * Resolver for study create/update/patch data
 * Converts ObjectId fields: createdBy, updatedBy
 * Converts array ObjectId fields: forms
 */
const studyDataResolver = resolve({
  createdBy: resolveCreatedBy,
  updatedBy: resolveUpdatedBy,
  forms: resolveObjectIdArray
});

/**
 * Resolver for study queries
 * Converts ObjectId fields for querying
 */
const studyQueryResolver = resolve({
  _id: resolveQueryObjectId,
  createdBy: resolveQueryObjectId,
  updatedBy: resolveQueryObjectId,
  forms: resolveQueryObjectId
});

module.exports = {
  studyDataResolver,
  studyQueryResolver
};
