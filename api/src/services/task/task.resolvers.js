const { resolve } = require('@feathersjs/schema');
const { resolveQueryObjectId } = require('@feathersjs/mongodb');
const { resolveCreatedBy, resolveUpdatedBy } = require('../../resolvers');

/**
 * Resolver for task create/update/patch data
 * Converts ObjectId fields: createdBy, updatedBy
 */
const taskDataResolver = resolve({
  createdBy: resolveCreatedBy,
  updatedBy: resolveUpdatedBy,
});

/**
 * Resolver for task queries
 * Converts ObjectId fields for querying
 */
const taskQueryResolver = resolve({
  _id: resolveQueryObjectId,
  createdBy: resolveQueryObjectId,
  updatedBy: resolveQueryObjectId
});

module.exports = {
  taskDataResolver,
  taskQueryResolver
};
