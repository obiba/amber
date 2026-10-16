// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const { BadRequest } = require('@feathersjs/errors');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    if (context.data && context.data.value && context.data.value.password) {
      // check password strong policy
      const strongPassword = (value) => value && value.length >= 8 && value.length <= 64 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value) && /[#?!@$%^&*-]/.test(value);
      if (!strongPassword(context.data.value.password)) {
        throw new BadRequest('Password must have between 8 and 64 chars and contain at least one of each: lower case letter, upper case letter, digit, special character.');
      }
    }
    return context;
  };
};
