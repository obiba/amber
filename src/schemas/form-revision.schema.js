const Joi = require('joi');
const { objectId, formSchemaDefinition } = require('./common');

/**
 * Form Revision schema validation
 * 
 * Hook-set fields (excluded from validation):
 * - publishedBy: Set by formRevisionCreate hook
 */

const formRevisionCreateSchema = Joi.object({
  schema: formSchemaDefinition.default({}),
  revision: Joi.number().integer(),
  comment: Joi.string().allow('', null),
  study: objectId,
  form: objectId
});

const formRevisionPatchSchema = Joi.object({
  schema: formSchemaDefinition,
  revision: Joi.number().integer(),
  comment: Joi.string().allow('', null),
  study: objectId,
  form: objectId
});

module.exports = {
  formRevisionCreateSchema,
  formRevisionPatchSchema
};
