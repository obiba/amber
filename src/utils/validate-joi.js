const { BadRequest } = require('@feathersjs/errors');

/**
 * Validates data against a Joi schema.
 * Compatible replacement for @feathers-plus/validate-joi
 */
const validateSchema = (schema, options = {}) => {
  const joiOptions = {
    abortEarly: false,
    convert: true,
    ...options
  };

  return async (context) => {
    const { data } = context;

    if (!data) {
      return context;
    }

    const { error, value } = schema.validate(data, joiOptions);

    if (error) {
      const errors = {};
      error.details.forEach(detail => {
        const key = detail.path.join('.');
        if (!errors[key]) {
          errors[key] = [];
        }
        errors[key].push(detail.message);
      });
      throw new BadRequest('Validation failed', { errors });
    }

    // Replace data with converted/sanitized values
    context.data = value;
    return context;
  };
};

module.exports = {
  validateSchema,
  // Alias for backward compatibility with validate.mongoose pattern
  mongoose: validateSchema
};
