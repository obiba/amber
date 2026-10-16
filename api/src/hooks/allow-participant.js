// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    const { params, app } = context;

    const participantConfig = app.get('authentication').participant;
    const headerConfig = participantConfig.header || 'authorization';
    const schemeConfig = participantConfig.scheme || 'participant';
    const header = params.headers[headerConfig];
    if (header) {
      const tokenWithScheme = header.split(' ');
      const scheme = tokenWithScheme[0];
      if (scheme.toLowerCase() === schemeConfig.toLowerCase()) {
        const token = tokenWithScheme[1];
        if (token) {
          const text = Buffer.from(token, 'base64').toString('ascii').split(':');
    
          if(params && params.provider && !params.authentication) {
            context.params = {
              ...params,
              authentication: {
                strategy: 'participant',
                code: text[0],
                password: text.length > 1 ? text[1] : undefined
              }
            };
          }
        }
      }
    }

    return context;
  };
};