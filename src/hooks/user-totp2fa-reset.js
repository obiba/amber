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
      if (context.result.email && context.data && context.data.action && context.data.action.startsWith('resetPwd')) {
        // reset 2FA secret
        context.result.totp2faEnabled = false;
        const res = await context.app.service('user').find({ query: { email: context.result.email } });
        if (res.data && res.data.length > 0) {
          context.app.service('user').patch(res.data[0]._id, { totp2faSecret: null });
        }
      }
    }
    return context;
  };
};
