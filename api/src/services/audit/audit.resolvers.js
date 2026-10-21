const { resolve } = require('@feathersjs/schema');
const { resolveQueryObjectId } = require('@feathersjs/mongodb');
const { resolveObjectId, resolveQueryDate } = require('../../resolvers');

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
  accessedBy: resolveQueryObjectId,
  'apiKey._id': resolveQueryObjectId,
  createdAt: resolveQueryDate
});

module.exports = {
  auditDataResolver,
  auditQueryResolver
};
