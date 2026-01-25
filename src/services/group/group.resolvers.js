const { resolve } = require('@feathersjs/schema');
const { resolveQueryObjectId } = require('@feathersjs/mongodb');
const { resolveObjectIdArray } = require('../../resolvers');

/**
 * Resolver for group create/update/patch data
 * Converts array ObjectId fields: users
 */
const groupDataResolver = resolve({
  users: resolveObjectIdArray
});

/**
 * Resolver for group queries
 * Converts ObjectId fields for querying
 */
const groupQueryResolver = resolve({
  _id: resolveQueryObjectId,
  users: resolveQueryObjectId
});

module.exports = {
  groupDataResolver,
  groupQueryResolver
};
