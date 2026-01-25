const Joi = require('joi');
const { objectId, permissionsSchema, stateEnums, repeatPolicyEnum } = require('./common');

/**
 * Case Report Form schema validation
 * 
 * Hook-set fields (excluded from validation):
 * - createdBy: Set by caseReportFormCreate hook
 */

const caseReportFormCreateSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
  form: objectId.required(),
  revision: Joi.number().integer(),
  state: Joi.string().valid(...stateEnums.caseReportForm).default('paused'),
  repeatPolicy: Joi.string().valid(...repeatPolicyEnum).default('single_reject'),
  permissions: permissionsSchema,
  study: objectId
});

const caseReportFormPatchSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string().allow('', null),
  form: objectId,
  revision: Joi.number().integer(),
  state: Joi.string().valid(...stateEnums.caseReportForm),
  repeatPolicy: Joi.string().valid(...repeatPolicyEnum),
  permissions: permissionsSchema,
  study: objectId
});

module.exports = {
  caseReportFormCreateSchema,
  caseReportFormPatchSchema
};
