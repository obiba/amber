const { resolve } = require('@feathersjs/schema');
const { resolveObjectId, resolveQueryObjectId } = require('@feathersjs/mongodb');
const { resolveCreatedBy, resolveUpdatedBy } = require('../../resolvers');

/**
 * Resolver for form create/update/patch data
 * Converts ObjectId fields: createdBy, updatedBy, study
 */
const formDataResolver = resolve({
  createdBy: resolveCreatedBy,
  updatedBy: resolveUpdatedBy,
  study: resolveObjectId
});

/**
 * Resolver for form queries
 * Converts ObjectId fields for querying
 */
const formQueryResolver = resolve({
  _id: resolveQueryObjectId,
  createdBy: resolveQueryObjectId,
  updatedBy: resolveQueryObjectId,
  study: resolveQueryObjectId
});

module.exports = {
  formDataResolver,
  formQueryResolver
};
