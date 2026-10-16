const Joi = require('joi');
const { taskTypeEnum, stateEnums } = require('./common');

/**
 * Task schema validation
 */

const logSchema = Joi.object({
  level: Joi.string().required(),
  message: Joi.string().required(),
  timestamp: Joi.date().required()
});

const taskCreateSchema = Joi.object({
  type: Joi.string().valid(...taskTypeEnum).required(),
  state: Joi.string().valid(...stateEnums.task).default('in_progress'),
  error: Joi.string().allow('', null),
  message: Joi.string().allow('', null),
  logs: Joi.array().items(logSchema).default([]),
  arguments: Joi.object()
});

const taskPatchSchema = Joi.object({
  type: Joi.string().valid(...taskTypeEnum),
  state: Joi.string().valid(...stateEnums.task),
  error: Joi.string().allow('', null),
  message: Joi.string().allow('', null),
  logs: Joi.array().items(logSchema),
  arguments: Joi.object()
});

module.exports = {
  taskCreateSchema,
  taskPatchSchema
};
