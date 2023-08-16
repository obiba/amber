// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    if (context.app.get('encrypt_data')) {
      const crypto = context.app.get('crypto');  
      if (Array.isArray(context.data)) {
        context.data
          .filter((participant) => participant.data)
          .forEach((participant) => {
            const encrypted = crypto.encrypt(JSON.stringify(participant.data));
            participant.data = {
              __value: encrypted
            };
          });
      } else if (context.data.data) {
        const encrypted = crypto.encrypt(JSON.stringify(context.data.data));
        context.data.data = {
          __value: encrypted
        };
      }
    }
    return context;
  };
};
