const { resolve } = require('@feathersjs/schema');
const { resolveObjectId, resolveQueryObjectId } = require('@feathersjs/mongodb');

/**
 * Resolver for case-report create/update/patch data
 * Converts ObjectId fields: createdBy, caseReportForm, study, form
 */
const caseReportDataResolver = resolve({
  createdBy: resolveObjectId,
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
  caseReportForm: resolveQueryObjectId,
  study: resolveQueryObjectId,
  form: resolveQueryObjectId
});

module.exports = {
  caseReportDataResolver,
  caseReportQueryResolver
};
