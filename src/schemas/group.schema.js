const Joi = require('joi');
const { objectIdArray } = require('./common');

/**
 * Group schema validation
 */

const groupCreateSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
  users: objectIdArray.default([])
});

const groupPatchSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string().allow('', null),
  users: objectIdArray
});

module.exports = {
  groupCreateSchema,
  groupPatchSchema
};
