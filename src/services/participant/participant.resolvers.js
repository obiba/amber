const { resolve } = require('@feathersjs/schema');
const { resolveObjectId, resolveQueryObjectId } = require('@feathersjs/mongodb');

/**
 * Resolver for participant create/update/patch data
 * Converts ObjectId fields: createdBy, study, interviewDesign, campaign
 */
const participantDataResolver = resolve({
  createdBy: resolveObjectId,
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
  study: resolveQueryObjectId,
  interviewDesign: resolveQueryObjectId,
  campaign: resolveQueryObjectId
});

module.exports = {
  participantDataResolver,
  participantQueryResolver
};
