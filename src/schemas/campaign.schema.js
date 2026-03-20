const Joi = require('joi');
const { objectId, objectIdArray } = require('./common');

/**
 * Campaign schema validation
 * 
 * Hook-set fields (excluded from validation):
 * - createdBy: Set by campaignCreate hook
 */

const campaignCreateSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
  investigators: objectIdArray.min(1).required(),
  supporters: objectIdArray.default([]),
  validFrom: Joi.date().iso().allow(null),
  validUntil: Joi.date().iso().allow(null),
  weeksInfoBeforeActivation: Joi.number().integer().min(0).default(2),
  weeksBetweenReminders: Joi.number().integer().min(0).default(2),
  numberOfReminders: Joi.number().integer().min(0).default(2),
  weeksToDeactivate: Joi.number().integer().min(0).default(18),
  weeksInfoBeforeDeactivation: Joi.number().integer().min(0).default(3),
  notifyOnInterviewCompletion: Joi.boolean().default(false),
  withPassword: Joi.boolean().default(false),
  walkInEnabled: Joi.boolean().default(false),
  walkInData: Joi.object().default({}),
  visitUrl: Joi.string().uri().allow('', null),
  completionUrl: Joi.string().uri().allow('', null),
  interviewDesign: objectId.required(),
  study: objectId
});

const campaignPatchSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string().allow('', null),
  investigators: objectIdArray.min(1),
  supporters: objectIdArray,
  validFrom: Joi.date().iso().allow(null),
  validUntil: Joi.date().iso().allow(null),
  weeksInfoBeforeActivation: Joi.number().integer().min(0),
  weeksBetweenReminders: Joi.number().integer().min(0),
  numberOfReminders: Joi.number().integer().min(0),
  weeksToDeactivate: Joi.number().integer().min(0),
  weeksInfoBeforeDeactivation: Joi.number().integer().min(0),
  notifyOnInterviewCompletion: Joi.boolean(),
  withPassword: Joi.boolean(),
  walkInEnabled: Joi.boolean(),
  walkInData: Joi.object(),
  visitUrl: Joi.string().uri().allow('', null),
  completionUrl: Joi.string().uri().allow('', null),
  interviewDesign: objectId,
  study: objectId
});

module.exports = {
  campaignCreateSchema,
  campaignPatchSchema
};
