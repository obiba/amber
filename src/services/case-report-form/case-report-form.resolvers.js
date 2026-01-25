const { resolve } = require('@feathersjs/schema');
const { resolveObjectId, resolveQueryObjectId } = require('@feathersjs/mongodb');
const { resolvePermissionsField } = require('../../resolvers');

/**
 * Resolver for case-report-form create/update/patch data
 * Converts ObjectId fields: createdBy, study, form
 * Converts nested permissions: permissions.users[], permissions.groups[]
 */
const caseReportFormDataResolver = resolve({
  createdBy: resolveObjectId,
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
  study: resolveQueryObjectId,
  form: resolveQueryObjectId
});

module.exports = {
  caseReportFormDataResolver,
  caseReportFormQueryResolver
};
