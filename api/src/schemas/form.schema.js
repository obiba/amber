const Joi = require('joi');
const { objectId, formSchemaDefinition } = require('./common');

/**
 * Form schema validation
 * 
 * Hook-set fields (excluded from validation):
 * - createdBy: Set by formCreate hook
 */

const formCreateSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
  schema: formSchemaDefinition.default({}),
  study: objectId
});

const formPatchSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string().allow('', null),
  schema: formSchemaDefinition,
  study: objectId
});

module.exports = {
  formCreateSchema,
  formPatchSchema
};
