const { resolve } = require('@feathersjs/schema');
const { resolveObjectId, resolveQueryObjectId } = require('@feathersjs/mongodb');

/**
 * Resolver for form-revision create/update/patch data
 * Converts ObjectId fields: publishedBy, study, form
 */
const formRevisionDataResolver = resolve({
  publishedBy: resolveObjectId,
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
  study: resolveQueryObjectId,
  form: resolveQueryObjectId
});

module.exports = {
  formRevisionDataResolver,
  formRevisionQueryResolver
};
