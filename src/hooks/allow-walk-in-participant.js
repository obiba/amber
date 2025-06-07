// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    const { params, app } = context;

    const walkInParticipantConfig = app.get('authentication').campaign;
    const headerConfig = walkInParticipantConfig.header || 'authorization';
    const schemeConfig = walkInParticipantConfig.scheme || 'campaign';
    const header = params.headers[headerConfig];
    if (header) {
      const tokenWithScheme = header.split(' ');
      const scheme = tokenWithScheme[0];
      if (scheme.toLowerCase() === schemeConfig.toLowerCase()) {
        const token = tokenWithScheme[1];
        if (token) {
          const text = Buffer.from(token, 'base64').toString('ascii');
          const query = JSON.parse(text);
          const participantData = {...query} || {};
          delete participantData.campaign;
    
          if(params && params.provider && !params.authentication) {
            context.params = {
              ...params,
              authentication: {
                strategy: 'campaign',
                campaign: query.campaign,
                data: participantData
              }
            };
          }
        }
      }
    }

    return context;
  };
};