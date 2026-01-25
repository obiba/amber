const { resolve } = require('@feathersjs/schema');
const { resolveObjectId, resolveQueryObjectId } = require('@feathersjs/mongodb');

/**
 * Resolver for form create/update/patch data
 * Converts ObjectId fields: createdBy, study
 */
const formDataResolver = resolve({
  createdBy: resolveObjectId,
  study: resolveObjectId
});

/**
 * Resolver for form queries
 * Converts ObjectId fields for querying
 */
const formQueryResolver = resolve({
  _id: resolveQueryObjectId,
  createdBy: resolveQueryObjectId,
  study: resolveQueryObjectId
});

module.exports = {
  formDataResolver,
  formQueryResolver
};
