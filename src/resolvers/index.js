const { resolve } = require('@feathersjs/schema');
const { resolveObjectId, resolveQueryObjectId } = require('@feathersjs/mongodb');
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
 * @param {any} value - The value to convert
 * @returns {ObjectId|any} - ObjectId or original value
 */
const toObjectId = (value) => {
  if (!value) return value;
  if (value instanceof ObjectId) return value;
  if (isValidObjectIdString(value)) {
    return new ObjectId(value);
  }
  return value;
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
  resolveStepsField
};
