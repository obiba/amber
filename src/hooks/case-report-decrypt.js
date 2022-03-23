// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    const crypto = context.app.get('crypto');
    if (context.result.total>0) {
      context.result.data.forEach(cr => {
        if (cr.data.value) {
          const decrypted = JSON.parse(crypto.decrypt(cr.data.value));
          cr.data = decrypted;
        }
      });
    } else if (context.result.data.value) {
      const decrypted = JSON.parse(crypto.decrypt(context.result.data.value));
      context.result.data = decrypted;
    }
    return context;
  };
};
