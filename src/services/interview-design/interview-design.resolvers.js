const { resolve } = require('@feathersjs/schema');
const { resolveObjectId, resolveQueryObjectId } = require('@feathersjs/mongodb');
const { resolvePermissionsField, resolveStepsField } = require('../../resolvers');

/**
 * Resolver for interview-design create/update/patch data
 * Converts ObjectId fields: createdBy, study
 * Converts nested permissions: permissions.users[], permissions.groups[]
 * Converts nested steps: steps[].form
 */
const interviewDesignDataResolver = resolve({
  createdBy: resolveObjectId,
  study: resolveObjectId,
  permissions: resolvePermissionsField,
  steps: resolveStepsField
});

/**
 * Resolver for interview-design queries
 * Converts ObjectId fields for querying
 */
const interviewDesignQueryResolver = resolve({
  _id: resolveQueryObjectId,
  createdBy: resolveQueryObjectId,
  study: resolveQueryObjectId
});

module.exports = {
  interviewDesignDataResolver,
  interviewDesignQueryResolver
};
