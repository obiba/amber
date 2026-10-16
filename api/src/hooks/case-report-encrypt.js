// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    if (context.app.get('encrypt_data')) {
      const crypto = context.app.get('crypto');
      const encrypted = crypto.encrypt(JSON.stringify(context.data.data));
      context.data.data = {
        _id: context.data.data._id,
        __value: encrypted
      };
    }
    return context;
  };
};
