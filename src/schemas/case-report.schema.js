const Joi = require('joi');
const { objectId, stateEnums, actionTypeEnums } = require('./common');

/**
 * Case Report schema validation
 * 
 * Hook-set fields (excluded from validation):
 * - createdBy: Set by caseReportCreate hook
 */

const caseReportActionSchema = Joi.object({
  type: Joi.string().valid(...actionTypeEnums.caseReport).default('complete'),
  user: Joi.string(),
  timestamp: Joi.number()
});

const caseReportCreateSchema = Joi.object({
  crfId: Joi.string(), // Used only in create hook, not stored
  caseReportForm: objectId,
  revision: Joi.number().integer().required(),
  state: Joi.string().valid(...stateEnums.caseReport).default('completed'),
  actions: Joi.array().items(caseReportActionSchema).default([]),
  data: Joi.object().default({}),
  study: objectId,
  form: objectId
});

const caseReportPatchSchema = Joi.object({
  caseReportForm: objectId,
  revision: Joi.number().integer(),
  state: Joi.string().valid(...stateEnums.caseReport),
  actions: Joi.array().items(caseReportActionSchema),
  data: Joi.object(),
  study: objectId,
  form: objectId
});

module.exports = {
  caseReportCreateSchema,
  caseReportPatchSchema
};
