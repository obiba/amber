const Joi = require('joi');
const { objectIdArray } = require('./common');

/**
 * API key schema validation
 *
 * Hook-set fields (excluded from validation):
 * - hash, prefix: Set by apiKeyGenerate hook
 * - lastUsedAt: Set by the dataApiKey authentication strategy
 */

const apiKeyCreateSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
  studies: objectIdArray.min(1).required(),
  expiresAt: Joi.date().allow(null),
  active: Joi.boolean().default(true)
});

const apiKeyPatchSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string().allow('', null),
  studies: objectIdArray.min(1),
  expiresAt: Joi.date().allow(null),
  active: Joi.boolean(),
  regenerate: Joi.boolean()
});

module.exports = {
  apiKeyCreateSchema,
  apiKeyPatchSchema
};
