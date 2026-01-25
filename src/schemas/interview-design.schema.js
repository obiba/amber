const Joi = require('joi');
const { objectId, permissionsSchema, stateEnums } = require('./common');

/**
 * Interview Design schema validation
 * 
 * Hook-set fields (excluded from validation):
 * - createdBy: Set by interviewDesignCreate hook
 */

const interviewDesignStepSchema = Joi.object({
  name: Joi.string().required(),
  label: Joi.string().required(),
  description: Joi.string().allow('', null),
  time_estimate: Joi.number().integer().min(0),
  time_estimate_max: Joi.number().integer().min(0),
  form: objectId.required(),
  revision: Joi.number().integer(),
  condition: Joi.string().allow('', null),
  disable: Joi.string().allow('', null)
});

const interviewDesignCreateSchema = Joi.object({
  name: Joi.string().required(),
  label: Joi.string().required(),
  description: Joi.string().allow('', null),
  interviewer_instructions: Joi.string().allow('', null),
  participant_instructions: Joi.string().allow('', null),
  study: objectId.required(),
  steps: Joi.array().items(interviewDesignStepSchema).default([]),
  i18n: Joi.object().default({}),
  state: Joi.string().valid(...stateEnums.interviewDesign).default('paused'),
  permissions: permissionsSchema
});

const interviewDesignPatchSchema = Joi.object({
  name: Joi.string(),
  label: Joi.string(),
  description: Joi.string().allow('', null),
  interviewer_instructions: Joi.string().allow('', null),
  participant_instructions: Joi.string().allow('', null),
  study: objectId,
  steps: Joi.array().items(interviewDesignStepSchema),
  i18n: Joi.object(),
  state: Joi.string().valid(...stateEnums.interviewDesign),
  permissions: permissionsSchema
});

module.exports = {
  interviewDesignCreateSchema,
  interviewDesignPatchSchema
};
