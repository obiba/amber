const Joi = require('joi');

/**
 * Common Joi patterns and schemas shared across all service schemas
 */

// ObjectId pattern - 24 hex characters (MongoDB ObjectId format) or ObjectId object
const objectId = Joi.alternatives().try(
  Joi.string().pattern(/^[a-fA-F0-9]{24}$/),
  Joi.object() // Allow MongoDB ObjectId objects
);

// ObjectId array
const objectIdArray = Joi.array().items(objectId);

// Permissions schema (used by interview-design, case-report-form)
const permissionsSchema = Joi.object({
  users: objectIdArray.default([]),
  groups: objectIdArray.default([])
});

// Common enums
const stateEnums = {
  interviewDesign: ['active', 'paused'],
  caseReportForm: ['active', 'paused'],
  interview: ['initiated', 'in_progress', 'completed'],
  interviewStep: ['in_progress', 'completed'],
  caseReport: ['in_progress', 'completed'],
  task: ['in_progress', 'completed', 'aborted']
};

const taskTypeEnum = [
  'participants-info-activate',
  'participants-activate',
  'participants-reminder',
  'participants-info-expire',
  'participants-deactivate',
  'participants-summary'
];

const actionTypeEnums = {
  interview: ['init', 'pause', 'complete', 'invalid', 'reopen'],
  caseReport: ['init', 'pause', 'complete']
};

const repeatPolicyEnum = ['single_reject', 'single_update', 'multiple'];

const reminderTypeEnum = ['participants-reminder', 'participants-info-expire'];

// Form schema definition (used by form and form-revision)
const formSchemaDefinition = Joi.object({
  name: Joi.string().default('.'),
  label: Joi.string().default('form_title'),
  description: Joi.string().allow('', null),
  copyright: Joi.string().allow('', null),
  license: Joi.string().allow('', null),
  layout: Joi.string().allow('', null),
  idLabel: Joi.string().allow('', null),
  idDescription: Joi.string().allow('', null),
  idMask: Joi.string().allow('', null),
  idValidation: Joi.string().allow('', null),
  idValidationMessage: Joi.string().allow('', null),
  items: Joi.array().items(Joi.object()),
  i18n: Joi.object()
});

// Default Joi validation options
// allowUnknown: true - allows system fields like _id, createdAt, updatedAt, __v
const joiOptions = {
  convert: true,
  abortEarly: false,
  allowUnknown: true
};

module.exports = {
  objectId,
  objectIdArray,
  permissionsSchema,
  stateEnums,
  taskTypeEnum,
  actionTypeEnums,
  repeatPolicyEnum,
  reminderTypeEnum,
  formSchemaDefinition,
  joiOptions
};
