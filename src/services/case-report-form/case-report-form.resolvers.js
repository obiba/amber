const { resolve } = require('@feathersjs/schema');
const { resolveQueryObjectId } = require('@feathersjs/mongodb');
const { resolveObjectId, resolvePermissionsField, resolveCreatedBy, resolveUpdatedBy } = require('../../resolvers');

/**
 * Resolver for case-report-form create/update/patch data
 * Converts ObjectId fields: createdBy, updatedBy, study, form
 * Converts nested permissions: permissions.users[], permissions.groups[]
 */
const caseReportFormDataResolver = resolve({
  createdBy: resolveCreatedBy,
  updatedBy: resolveUpdatedBy,
  study: resolveObjectId,
  form: resolveObjectId,
  permissions: resolvePermissionsField
});

/**
 * Resolver for case-report-form queries
 * Converts ObjectId fields for querying
 */
const caseReportFormQueryResolver = resolve({
  _id: resolveQueryObjectId,
  createdBy: resolveQueryObjectId,
  updatedBy: resolveQueryObjectId,
  study: resolveQueryObjectId,
  form: resolveQueryObjectId
});

module.exports = {
  caseReportFormDataResolver,
  caseReportFormQueryResolver
};
