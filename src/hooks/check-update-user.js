// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    if (context.params.user && context.params.user.role !== 'administrator')
      context.data.role = context.params.user.role;
    // clean not required fields that cannot be empty
    ['phone', 'title', 'institution', 'city'].forEach(field => {
      if (context.data[field] !== undefined && context.data[field].trim().length === 0)
        delete context.data[field];
    });
    // disable 2FA by dropping secret
    if (context.data.with2fa === false || context.data.totp2faEnabled === false) {
      delete context.data.totp2faEnabled;
      context.data.totp2faSecret = null;
    }
    if (context.data.totp2faRequired === false) {
      context.data.totp2faSecret = null;
    }
    return context;
  };
};
