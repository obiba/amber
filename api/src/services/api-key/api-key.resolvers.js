const { resolve } = require('@feathersjs/schema');
const { resolveQueryObjectId } = require('@feathersjs/mongodb');
const { resolveObjectIdArray, resolveCreatedBy, resolveUpdatedBy } = require('../../resolvers');

/**
 * Resolver for api key create/update/patch data
 * Converts ObjectId fields: createdBy, updatedBy
 * Converts array ObjectId fields: studies
 */
const apiKeyDataResolver = resolve({
  createdBy: resolveCreatedBy,
  updatedBy: resolveUpdatedBy,
  studies: resolveObjectIdArray
});

/**
 * Resolver for api key queries
 * Converts ObjectId fields for querying
 */
const apiKeyQueryResolver = resolve({
  _id: resolveQueryObjectId,
  createdBy: resolveQueryObjectId,
  updatedBy: resolveQueryObjectId,
  studies: resolveQueryObjectId
});

module.exports = {
  apiKeyDataResolver,
  apiKeyQueryResolver
};
