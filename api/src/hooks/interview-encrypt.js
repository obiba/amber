// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    if (context.app.get('encrypt_data')) {
      const crypto = context.app.get('crypto');
      // participant data
      if (context.data.data) {
        const encrypted = crypto.encrypt(JSON.stringify(context.data.data));
        context.data.data = {
          __value: encrypted
        };
      }
      // steps data
      if (context.data.steps) {
        for (const step of context.data.steps) {
          const encrypted = crypto.encrypt(JSON.stringify(step.data));
          step.data = {
            __value: encrypted
          };
        }
      }
    }
    return context;
  };
};
