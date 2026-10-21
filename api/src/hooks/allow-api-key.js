// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

module.exports = (options = {}) => {
  return async context => {
    const { params, app } = context;
    
    if (params.provider === 'rest' && !params.authentication) {
      const { strategy = 'apiKey', header = app.get('authentication').apiKey.header } = options;
      const token = params.headers[header];
  
      if (token) {
        context.params = {
          ...params,
          authentication: {
            strategy,
            token
          }
        };
      }
    }

    return context;
  };
};
