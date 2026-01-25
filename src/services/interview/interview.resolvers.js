const { resolve } = require('@feathersjs/schema');
const { resolveObjectId, resolveQueryObjectId } = require('@feathersjs/mongodb');
const { resolveStepsField, resolveCreatedBy, resolveUpdatedBy } = require('../../resolvers');

/**
 * Resolver for interview create/update/patch data
 * Converts ObjectId fields: participant, createdBy, updatedBy, campaign, interviewDesign, study
 * Converts nested steps: steps[].form
 */
const interviewDataResolver = resolve({
  participant: resolveObjectId,
  createdBy: resolveCreatedBy,
  updatedBy: resolveUpdatedBy,
  campaign: resolveObjectId,
  interviewDesign: resolveObjectId,
  study: resolveObjectId,
  steps: resolveStepsField
});

/**
 * Resolver for interview queries
 * Converts ObjectId fields for querying
 */
const interviewQueryResolver = resolve({
  _id: resolveQueryObjectId,
  participant: resolveQueryObjectId,
  createdBy: resolveQueryObjectId,
  updatedBy: resolveQueryObjectId,
  campaign: resolveQueryObjectId,
  interviewDesign: resolveQueryObjectId,
  study: resolveQueryObjectId
});

module.exports = {
  interviewDataResolver,
  interviewQueryResolver
};
