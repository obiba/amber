const { resolve } = require('@feathersjs/schema');
const { resolveQueryObjectId } = require('@feathersjs/mongodb');
const { ObjectId } = require('mongodb');

/**
 * Checks if a value is a valid ObjectId string (24 hex characters)
 * @param {any} value - The value to check
 * @returns {boolean} - True if valid ObjectId string
 */
const isValidObjectIdString = (value) => {
  if (typeof value !== 'string') return false;
  return /^[a-fA-F0-9]{24}$/.test(value);
};

/**
 * Converts a value to ObjectId if it's a valid ObjectId string
 * Returns undefined/null as-is to avoid generating random ObjectIds
 * @param {any} value - The value to convert
 * @returns {ObjectId|any} - ObjectId or original value
 */
const toObjectId = (value) => {
  if (value === undefined || value === null) return value;
  if (value instanceof ObjectId) return value;
  if (isValidObjectIdString(value)) {
    return new ObjectId(value);
  }
  return value;
};

/**
 * Safe resolver for ObjectId fields - does NOT convert undefined/null to random ObjectIds
 * Use this instead of @feathersjs/mongodb resolveObjectId for data resolvers
 * @param {any} value - The value to resolve
 * @returns {ObjectId|undefined} - ObjectId or undefined (to skip the field)
 */
const resolveObjectId = async (value) => {
  // Return undefined to skip setting this field if no value provided
  if (value === undefined) return undefined;
  return toObjectId(value);
};

/**
 * Converts an array of values to ObjectIds
 * @param {any[]} arr - Array of values
 * @returns {ObjectId[]|any[]} - Array of ObjectIds or original array
 */
const toObjectIdArray = (arr) => {
  if (!Array.isArray(arr)) return arr;
  return arr.map(toObjectId);
};

/**
 * Creates a resolver for nested permissions object with users and groups arrays
 * @param {object} value - The permissions object
 * @returns {object} - Permissions with ObjectId arrays
 */
const resolvePermissions = (value) => {
  if (!value) return value;
  return {
    ...value,
    users: value.users ? toObjectIdArray(value.users) : [],
    groups: value.groups ? toObjectIdArray(value.groups) : []
  };
};

/**
 * Creates a resolver for steps array with nested form ObjectId
 * @param {object[]} steps - Array of step objects
 * @returns {object[]} - Steps with ObjectId form fields
 */
const resolveSteps = (steps) => {
  if (!Array.isArray(steps)) return steps;
  return steps.map(step => ({
    ...step,
    form: step.form ? toObjectId(step.form) : step.form
  }));
};

/**
 * Resolver function for array of ObjectIds
 * Use with resolve() for array fields like investigators, supporters, etc.
 * @param {any} value - The array value
 * @returns {ObjectId[]|any} - Array of ObjectIds or original value
 */
const resolveObjectIdArray = async (value) => {
  return toObjectIdArray(value);
};

/**
 * Resolver function for permissions object
 * Use with resolve() for permissions fields with users and groups arrays
 * @param {any} value - The permissions object
 * @returns {object|any} - Permissions with ObjectId arrays or original value
 */
const resolvePermissionsField = async (value) => {
  return resolvePermissions(value);
};

/**
 * Resolver function for steps array with nested form ObjectId
 * Use with resolve() for steps fields in interview and interview-design
 * @param {any} value - The steps array
 * @returns {object[]|any} - Steps with ObjectId form fields or original value
 */
const resolveStepsField = async (value) => {
  return resolveSteps(value);
};

/**
 * Resolver function for createdBy field
 * Sets to current user's _id on create operations
 * @param {any} value - The current value
 * @param {object} _data - The data object (unused)
 * @param {object} context - The Feathers context
 * @returns {ObjectId|any} - User's ObjectId or original value
 */
const resolveCreatedBy = async (value, _data, context) => {
  // Only set on create if not already set
  if (context.method === 'create' && !value && context.params.user?._id) {
    return toObjectId(context.params.user._id);
  }
  return value ? toObjectId(value) : value;
};

/**
 * Resolver function for updatedBy field
 * Sets to current user's _id on create/update/patch operations
 * @param {any} value - The current value
 * @param {object} _data - The data object (unused)
 * @param {object} context - The Feathers context
 * @returns {ObjectId|any} - User's ObjectId or original value
 */
const resolveUpdatedBy = async (value, _data, context) => {
  if (context.params.user?._id) {
    return toObjectId(context.params.user._id);
  }
  return value ? toObjectId(value) : value;
};

module.exports = {
  resolve,
  resolveObjectId,
  resolveQueryObjectId,
  toObjectId,
  toObjectIdArray,
  isValidObjectIdString,
  resolvePermissions,
  resolveSteps,
  resolveObjectIdArray,
  resolvePermissionsField,
  resolveStepsField,
  resolveCreatedBy,
  resolveUpdatedBy
};
