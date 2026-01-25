const Joi = require('joi');

/**
 * Audit schema validation
 * 
 * Hook-set fields (excluded from validation):
 * - accessedBy: Set by auditCreateInternal hook
 */

const auditCreateSchema = Joi.object({
  service: Joi.string().required(),
  query: Joi.string().default(''),
  data: Joi.object().default({})
});

const auditPatchSchema = Joi.object({
  service: Joi.string(),
  query: Joi.string(),
  data: Joi.object()
});

module.exports = {
  auditCreateSchema,
  auditPatchSchema
};
