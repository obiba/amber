const Joi = require('joi');
const { objectIdArray } = require('./common');

/**
 * Study schema validation
 * 
 * Hook-set fields (excluded from validation):
 * - createdBy: Set by studyCreate hook
 */

const studyCreateSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
  services: Joi.array().default([]),
  forms: objectIdArray
});

const studyPatchSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string().allow('', null),
  services: Joi.array(),
  forms: objectIdArray
});

module.exports = {
  studyCreateSchema,
  studyPatchSchema
};
