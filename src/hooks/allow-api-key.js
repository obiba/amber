// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    const { params, app } = context;
    
    if (params.provider === 'rest' && !params.authentication) {
      const headerField = app.get('authentication').apiKey.header;
      const token = params.headers[headerField];
  
      if (token) {
        context.params = {
          ...params,
          authentication: {
            strategy: 'apiKey',
            token
          }
        };
      }
    }

    return context;
  };
};
