// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

const { ObjectId } = require('mongodb');

/**
 * Checks if a value is a valid ObjectId string (24 hex characters)
 */
const isValidObjectIdString = (value) => {
  if (typeof value !== 'string') return false;
  return /^[a-fA-F0-9]{24}$/.test(value);
};

/**
 * Converts a value to ObjectId if it's a valid ObjectId string
 */
const toObjectId = (value) => {
  if (value === undefined || value === null) return value;
  if (value instanceof ObjectId) return value;
  if (isValidObjectIdString(value)) {
    return ObjectId.createFromHexString(value);
  }
  return value;
};

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {

    const rewriteQuery = (q) => {
      for (let field in q) {
        // Handle search transformation
        if(q[field] !== undefined && q[field].$search && field.indexOf('$') == -1) {
          q[field] = { $regex: new RegExp(q[field].$search, 'i') };
        }
        // Recursively process $or and $and operators
        else if(field === '$or' || field === '$and') {
          q[field] = q[field].map((action) => {
            return rewriteQuery(action);
          });
        }
        // Convert ObjectId fields for fields not starting with $
        else if (field.indexOf('$') !== 0 && typeof q[field] === 'string') {
          q[field] = toObjectId(q[field]);
        }
      }
      return q;
    };

    const query = context.params.query;
    if (query) {
      if (query.$skip === undefined) {
        query.$skip = 0;
      }
      if (query.$limit === undefined) {
        query.$limit = 50;
      }
      context.params.query = rewriteQuery(query);
    }
    
    return context;
  };
};
