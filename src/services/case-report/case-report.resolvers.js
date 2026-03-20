const { resolve } = require('@feathersjs/schema');
const { resolveQueryObjectId } = require('@feathersjs/mongodb');
const { resolveObjectId, resolveCreatedBy, resolveUpdatedBy } = require('../../resolvers');

/**
 * Resolver for case-report create/update/patch data
 * Converts ObjectId fields: createdBy, updatedBy, caseReportForm, study, form
 */
const caseReportDataResolver = resolve({
  createdBy: resolveCreatedBy,
  updatedBy: resolveUpdatedBy,
  caseReportForm: resolveObjectId,
  study: resolveObjectId,
  form: resolveObjectId
});

/**
 * Resolver for case-report queries
 * Converts ObjectId fields for querying
 */
const caseReportQueryResolver = resolve({
  _id: resolveQueryObjectId,
  createdBy: resolveQueryObjectId,
  updatedBy: resolveQueryObjectId,
  caseReportForm: resolveQueryObjectId,
  study: resolveQueryObjectId,
  form: resolveQueryObjectId
});

module.exports = {
  caseReportDataResolver,
  caseReportQueryResolver
};
