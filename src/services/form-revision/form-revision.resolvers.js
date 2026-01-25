const { resolve } = require('@feathersjs/schema');
const { resolveObjectId, resolveQueryObjectId } = require('@feathersjs/mongodb');
const { resolveUpdatedBy } = require('../../resolvers');

/**
 * Resolver for form-revision create/update/patch data
 * Converts ObjectId fields: publishedBy (acts as createdBy), updatedBy, study, form
 */
const formRevisionDataResolver = resolve({
  publishedBy: resolveObjectId,
  updatedBy: resolveUpdatedBy,
  study: resolveObjectId,
  form: resolveObjectId
});

/**
 * Resolver for form-revision queries
 * Converts ObjectId fields for querying
 */
const formRevisionQueryResolver = resolve({
  _id: resolveQueryObjectId,
  publishedBy: resolveQueryObjectId,
  updatedBy: resolveQueryObjectId,
  study: resolveQueryObjectId,
  form: resolveQueryObjectId
});

module.exports = {
  formRevisionDataResolver,
  formRevisionQueryResolver
};
