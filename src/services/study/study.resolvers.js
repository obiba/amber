const { resolve } = require('@feathersjs/schema');
const { resolveObjectId, resolveQueryObjectId } = require('@feathersjs/mongodb');
const { resolveObjectIdArray } = require('../../resolvers');

/**
 * Resolver for study create/update/patch data
 * Converts ObjectId fields: createdBy
 * Converts array ObjectId fields: forms
 */
const studyDataResolver = resolve({
  createdBy: resolveObjectId,
  forms: resolveObjectIdArray
});

/**
 * Resolver for study queries
 * Converts ObjectId fields for querying
 */
const studyQueryResolver = resolve({
  _id: resolveQueryObjectId,
  createdBy: resolveQueryObjectId,
  forms: resolveQueryObjectId
});

module.exports = {
  studyDataResolver,
  studyQueryResolver
};
