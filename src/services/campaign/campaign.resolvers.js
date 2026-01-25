const { resolve } = require('@feathersjs/schema');
const { resolveObjectId, resolveQueryObjectId } = require('@feathersjs/mongodb');
const { resolveObjectIdArray, resolveCreatedBy, resolveUpdatedBy } = require('../../resolvers');

/**
 * Resolver for campaign create/update/patch data
 * Converts ObjectId fields: interviewDesign, study, createdBy, updatedBy
 * Converts array ObjectId fields: investigators, supporters
 */
const campaignDataResolver = resolve({
  interviewDesign: resolveObjectId,
  study: resolveObjectId,
  createdBy: resolveCreatedBy,
  updatedBy: resolveUpdatedBy,
  investigators: resolveObjectIdArray,
  supporters: resolveObjectIdArray
});

/**
 * Resolver for campaign queries
 * Converts ObjectId fields for querying
 */
const campaignQueryResolver = resolve({
  _id: resolveQueryObjectId,
  interviewDesign: resolveQueryObjectId,
  study: resolveQueryObjectId,
  createdBy: resolveQueryObjectId,
  updatedBy: resolveQueryObjectId,
  investigators: resolveQueryObjectId,
  supporters: resolveQueryObjectId
});

module.exports = {
  campaignDataResolver,
  campaignQueryResolver
};
