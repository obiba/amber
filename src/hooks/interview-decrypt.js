// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    const crypto = context.app.get('crypto');

    function isEncrypted(item) {
      if (item.data && item.data.__value) return true;
      return item.steps && item.steps.find((step) => step.data && step.data.__value);
    }

    function decrypt(itw) {
      if (itw.data && itw.data.__value) {
        const decrypted = JSON.parse(crypto.decrypt(itw.data.__value));
        itw.data = decrypted;
      }
      if (itw.steps) {
        itw.steps
          .filter((step) => isEncrypted(step))
          .forEach((step) => {
            const decrypted = JSON.parse(crypto.decrypt(step.data.__value));
            step.data = decrypted;
          });
      }
      return itw;
    }

    if (context.result.total>0) {
      context.result.data = context.result.data
        .map(itw => isEncrypted(itw) ? decrypt(itw) : itw);
    } else if (isEncrypted(context.result)) {
      context.result = decrypt(context.result);
    }
    return context;
  };
};
