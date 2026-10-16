const { resolve } = require('@feathersjs/schema');
const { resolveQueryObjectId } = require('@feathersjs/mongodb');
const { resolveObjectIdArray, resolveCreatedBy, resolveUpdatedBy } = require('../../resolvers');

/**
 * Resolver for group create/update/patch data
 * Converts ObjectId fields: createdBy, updatedBy
 * Converts array ObjectId fields: users
 */
const groupDataResolver = resolve({
  createdBy: resolveCreatedBy,
  updatedBy: resolveUpdatedBy,
  users: resolveObjectIdArray
});

/**
 * Resolver for group queries
 * Converts ObjectId fields for querying
 */
const groupQueryResolver = resolve({
  _id: resolveQueryObjectId,
  createdBy: resolveQueryObjectId,
  updatedBy: resolveQueryObjectId,
  users: resolveQueryObjectId
});

module.exports = {
  groupDataResolver,
  groupQueryResolver
};
