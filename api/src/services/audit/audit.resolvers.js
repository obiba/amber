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
 * Date range operators ($gte, $lte...) arrive as strings
 */
const resolveQueryDate = async (value) => {
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([op, v]) => [op, new Date(v)]));
};

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
