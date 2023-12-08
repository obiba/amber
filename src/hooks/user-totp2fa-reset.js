// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    if (context.result) {
      if (context.result.totp2faSecret) {
        // sanitize result
        delete context.result.totp2faSecret;
      }
      if (context.result._id && context.data && context.data.action && context.data.action.startsWith('resetPwd')) {
        // reset 2FA secret
        context.result.totp2faEnabled = false;
        context.app.service('user').patch(context.result._id, { totp2faSecret: null });
      }
    }
    return context;
  };
};
