const Joi = require('joi');
const { objectId, reminderTypeEnum } = require('./common');

/**
 * Participant schema validation
 * 
 * Hook-set fields (excluded from validation):
 * - createdBy: Set by participantCreate hook
 * - lastSeen: Set internally
 * - initAt: Set internally
 */

const reminderSchema = Joi.object({
  type: Joi.string().valid(...reminderTypeEnum),
  date: Joi.date().iso()
});

const participantCreateSchema = Joi.object({
  code: Joi.string().required(),
  password: Joi.string().allow('', null),
  identifier: Joi.string().allow('', null),
  validFrom: Joi.date().iso().allow(null),
  validUntil: Joi.date().iso().allow(null),
  initialContact: Joi.date().iso().allow(null),
  reminders: Joi.array().items(reminderSchema).default([]),
  activated: Joi.boolean().default(true),
  data: Joi.object().default({}),
  campaign: objectId.required(),
  study: objectId,
  interviewDesign: objectId
});

const participantPatchSchema = Joi.object({
  code: Joi.string(),
  password: Joi.string().allow('', null),
  identifier: Joi.string().allow('', null),
  validFrom: Joi.date().iso().allow(null),
  validUntil: Joi.date().iso().allow(null),
  initialContact: Joi.date().iso().allow(null),
  reminders: Joi.array().items(reminderSchema),
  activated: Joi.boolean(),
  data: Joi.object(),
  lastSeen: Joi.date().iso().allow(null),
  initAt: Joi.date().iso().allow(null),
  study: objectId,
  interviewDesign: objectId
});

module.exports = {
  participantCreateSchema,
  participantPatchSchema
};
