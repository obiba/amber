const Joi = require('joi');
const { objectId, stateEnums, actionTypeEnums } = require('./common');

/**
 * Interview schema validation
 * 
 * Hook-set fields (excluded from validation):
 * - createdBy: Set by interviewCreate hook
 */

const interviewActionSchema = Joi.object({
  type: Joi.string().valid(...actionTypeEnums.interview).default('complete'),
  user: Joi.string(),
  timestamp: Joi.number()
});

const interviewStepSchema = Joi.object({
  name: Joi.string().required(),
  form: objectId.required(),
  revision: Joi.number().integer().required(),
  state: Joi.string().valid(...stateEnums.interviewStep).default('in_progress'),
  actions: Joi.array().items(interviewActionSchema).default([]),
  data: Joi.object().default({})
});

const interviewCreateSchema = Joi.object({
  code: Joi.string().required(),
  identifier: Joi.string().allow('', null),
  participant: objectId.required(),
  campaign: objectId.required(),
  study: objectId,
  interviewDesign: objectId,
  steps: Joi.array().items(interviewStepSchema).default([]),
  state: Joi.string().valid(...stateEnums.interview).default('initiated'),
  data: Joi.object().default({}),
  fillingDate: Joi.date().iso().allow(null)
});

const interviewPatchSchema = Joi.object({
  code: Joi.string(),
  identifier: Joi.string().allow('', null),
  participant: objectId,
  campaign: objectId,
  study: objectId,
  interviewDesign: objectId,
  steps: Joi.array().items(interviewStepSchema),
  state: Joi.string().valid(...stateEnums.interview),
  data: Joi.object(),
  fillingDate: Joi.date().iso().allow(null)
});

module.exports = {
  interviewCreateSchema,
  interviewPatchSchema
};
