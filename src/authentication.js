const { AuthenticationService, JWTStrategy } = require('@feathersjs/authentication');
const { expressOauth } = require('@feathersjs/authentication-oauth');
const { totp2fa } = require('feathers-totp-2fa').hooks;
const authActivity = require('./hooks/auth-activity');
const { AnonymousStrategy, ActiveLocalStrategy, ApiKeyStrategy, ParticipantStrategy } = require('./utils/auth-strategies');

module.exports = app => {
  const authentication = new AuthenticationService(app);

  authentication.register('jwt', new JWTStrategy());
  authentication.register('local', new ActiveLocalStrategy());
  authentication.register('anonymous', new AnonymousStrategy());
  authentication.register('apiKey', new ApiKeyStrategy());
  authentication.register('participant', new ParticipantStrategy());

  app.use('/authentication', authentication);
  const authenticationConfig = app.get('authentication');
  app.service('authentication').hooks({
    after: {
      create: [
        authActivity(),
        totp2fa({
          usersService: 'user',
          applicationName: authenticationConfig.jwtOptions.issuer,
          cryptoUtil: app.get('crypto')
        })
      ]
    }
  });
  app.configure(expressOauth());
};
