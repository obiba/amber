const { AuthenticationService, JWTStrategy } = require('@feathersjs/authentication');
const { oauth } = require('@feathersjs/authentication-oauth');
const totp2fa = require('./hooks/totp-2fa');
const authActivity = require('./hooks/auth-activity');
const authEmailOtp = require('./hooks/auth-email-otp');
const { iff } = require('feathers-hooks-common');

const { AnonymousStrategy, ActiveLocalStrategy, ApiKeyStrategy, ParticipantStrategy, WalkInParticipantStrategy, BaseOAuthUserStrategy, GithubStrategy, GoogleStrategy, OidcStrategy } = require('./utils/auth-strategies');

const NON_PROVIDER_KEYS = new Set(['redirect', 'origins', 'defaults']);



module.exports = app => {
  const authentication = new AuthenticationService(app);

  authentication.register('jwt', new JWTStrategy());
  authentication.register('local', new ActiveLocalStrategy());
  authentication.register('anonymous', new AnonymousStrategy());
  authentication.register('apiKey', new ApiKeyStrategy());
  authentication.register('participant', new ParticipantStrategy());
  authentication.register('campaign', new WalkInParticipantStrategy());
  authentication.register('oidc', new OidcStrategy());

  // Register strategies for configured OAuth providers; fall back to BaseOAuthUserStrategy
  const OAUTH_STRATEGIES = { github: GithubStrategy, google: GoogleStrategy };
  const oauthConfig = app.get('authentication').oauth || {};
  Object.keys(oauthConfig)
    .filter(k => !NON_PROVIDER_KEYS.has(k) && !k.startsWith('_') && k !== 'oidc')
    .forEach(provider => {
      const StrategyClass = OAUTH_STRATEGIES[provider] || BaseOAuthUserStrategy;
      authentication.register(provider, new StrategyClass());
    });

  app.use('/authentication', authentication);
  const authenticationConfig = app.get('authentication');
  app.service('authentication').hooks({
    after: {
      create: [
        authActivity(),
        authEmailOtp(),
        iff(
          context => context.result.user.with2fa !== false && context.result.otp !== true,
          totp2fa({
            usersService: 'user',
            applicationName: authenticationConfig.jwtOptions.issuer,
            cryptoUtil: app.get('crypto')
          })
        )
      ]
    }
  });
  app.configure(oauth());
};
