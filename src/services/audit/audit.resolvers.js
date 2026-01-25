const { resolve } = require('@feathersjs/schema');
const { resolveObjectId, resolveQueryObjectId } = require('@feathersjs/mongodb');

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
