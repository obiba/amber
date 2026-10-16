const { resolve } = require('@feathersjs/schema');
const { resolveQueryObjectId } = require('@feathersjs/mongodb');
const { resolveObjectId, resolveCreatedBy, resolveUpdatedBy } = require('../../resolvers');

/**
 * Resolver for participant create/update/patch data
 * Converts ObjectId fields: createdBy, updatedBy, study, interviewDesign, campaign
 */
const participantDataResolver = resolve({
  createdBy: resolveCreatedBy,
  updatedBy: resolveUpdatedBy,
  study: resolveObjectId,
  interviewDesign: resolveObjectId,
  campaign: resolveObjectId
});

/**
 * Resolver for participant queries
 * Converts ObjectId fields for querying
 */
const participantQueryResolver = resolve({
  _id: resolveQueryObjectId,
  createdBy: resolveQueryObjectId,
  updatedBy: resolveQueryObjectId,
  study: resolveQueryObjectId,
  interviewDesign: resolveQueryObjectId,
  campaign: resolveQueryObjectId
});

module.exports = {
  participantDataResolver,
  participantQueryResolver
};
