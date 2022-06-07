// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    if (Array.isArray(context.result.data)) {
      //
      context.result.data.forEach(user => {
        user.totp2faEnabled = user.totp2faSecret ? true : false;
      });
    } else if (context.result.totp2faRequired) {
      context.result.totp2faEnabled = context.result.totp2faSecret ? true : false;
    }
    return context;
  };
};
