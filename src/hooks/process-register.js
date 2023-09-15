const axios = require('axios');
const { BadRequest, Forbidden } = require('@feathersjs/errors');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {

    // extract the incoming request data
    const { data, params, app } = context;

    // only if it is a transported request (provider)
    // and there is no auth (anonymous)
    if (params.provider && params.authentication.strategy === 'anonymous') {
      // verify the incoming token against the reCAPTCHA service
      const response = await axios(
        {
          method: 'post',
          url: 'https://www.google.com/recaptcha/api/siteverify',
          params: {
            secret: process.env.RECAPTCHA_SECRET_KEY || context.app.get('recaptcha_secret_key'),
            response: data.token
          }
        }
      );

      // if the response fails throw an error
      if ( !response.data.success ) {
        throw new BadRequest('reCAPTCHA fail');      
      }
    }

    const signupConfig = app.get('signup');
    const domain = context.data.email.split('@')[1];
    if (signupConfig.whitelist) {
      if (!signupConfig.whitelist.includes('*') && !signupConfig.whitelist.includes(domain)) {
        throw new Forbidden('Signup is forbidden for this email domain');
      }
    }
    if (signupConfig.blacklist && signupConfig.blacklist.length > 0) {
      if (signupConfig.blacklist.includes(domain)) {
        throw new Forbidden('Signup is forbidden for this email domain');
      }
    }
    
    return context;
  };
};
