const { resolve } = require('@feathersjs/schema');
const { resolveQueryObjectId } = require('@feathersjs/mongodb');
const { resolveObjectId } = require('../../resolvers');

/**
 * Resolver for audit create/update/patch data
 * Converts ObjectId fields: accessedBy
 */
const auditDataResolver = resolve({
  accessedBy: resolveObjectId
});

/**
 * Resolver for audit queries
 * Converts ObjectId fields for querying
 */
const auditQueryResolver = resolve({
  _id: resolveQueryObjectId,
  accessedBy: resolveQueryObjectId
});

module.exports = {
  auditDataResolver,
  auditQueryResolver
};
