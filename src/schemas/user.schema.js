const Joi = require('joi');

/**
 * User schema validation
 * 
 * Moved from user.hooks.js for consistency with other services
 */

const firstname = Joi.string()
  .trim()
  .min(2)
  .max(30)
  .required();

const lastname = Joi.string()
  .trim()
  .min(2)
  .max(30)
  .required();

const language = Joi.string()
  .trim()
  .min(2)
  .max(5);

const strongPasswordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,64}$/;
const password = Joi.string().trim()
  .regex(strongPasswordRegex)
  .min(8)
  .max(64)
  .required();

const email = Joi.string()
  .email({
    minDomainSegments: 2,
  })
  .required();

const institution = Joi.string()
  .trim()
  .min(2)
  .max(100);

const city = Joi.string()
  .trim()
  .min(2)
  .max(30);

const title = Joi.string()
  .trim()
  .min(2)
  .max(30);

const phone = Joi.string()
  .trim()
  .min(2)
  .max(30)
  .pattern(new RegExp('^[+0-9 ]{2,30}$'));

const permissions = Joi.array();

const role = Joi.string()
  .trim()
  .pattern(new RegExp('^(guest|interviewer|manager|administrator|inactive)$'));

// Schema for anonymous user registration
const userRegisterSchema = Joi.object().keys({
  firstname: firstname,
  lastname: lastname,
  language: language,
  email: email,
  password: password,
  clientId: Joi.string().trim()
});

// Schema for admin user creation
const userAdminCreateSchema = Joi.object().keys({
  firstname: firstname,
  lastname: lastname,
  language: language,
  email: email,
  password: password,
  permissions: permissions,
  role: role,
  city: city,
  institution: institution,
  title: title,
  phone: phone,
  with2fa: Joi.boolean(),
  totp2faRequired: Joi.boolean()
});

// Schema for user updates (admin)
const userAdminUpdateSchema = Joi.object().keys({
  firstname: firstname,
  lastname: lastname,
  language: language,
  city: city,
  institution: institution,
  title: title,
  phone: phone,
  permissions: permissions,
  role: role,
  with2fa: Joi.boolean(),
  totp2faSecret: Joi.any(),
  totp2faRequired: Joi.boolean()
});

module.exports = {
  userRegisterSchema,
  userAdminCreateSchema,
  userAdminUpdateSchema,
  // Export individual field validators for reuse
  firstname,
  lastname,
  language,
  password,
  email,
  institution,
  city,
  title,
  phone,
  permissions,
  role
};
