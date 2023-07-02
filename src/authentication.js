const { NotAuthenticated } = require('@feathersjs/errors');
const { AuthenticationBaseStrategy, AuthenticationService, JWTStrategy } = require('@feathersjs/authentication');
const { LocalStrategy } = require('@feathersjs/authentication-local');
const { expressOauth } = require('@feathersjs/authentication-oauth');
const { totp2fa } = require('feathers-totp-2fa').hooks;
const authActivity = require('./hooks/auth-activity');

class AnonymousStrategy extends AuthenticationBaseStrategy {
  // eslint-disable-next-line no-unused-vars
  async authenticate(authentication, params) {
    return {
      anonymous: true
    };
  }
}

class ActiveLocalStrategy extends LocalStrategy {
  async getEntityQuery(query) {
    // Query for user but only include non `inactive` ones
    return {
      ...query,
      role: {
        $ne: 'inactive'
      },
      $limit: 1
    };
  }
}

class APIKeyStrategy extends AuthenticationBaseStrategy {
  // eslint-disable-next-line no-unused-vars
  async authenticate(data, params) {
    // find an invitation by the provided code
    // if no such invitation code is found throw a NotAuthenticated exception
    // else attach the invitation to the returned result
    const invitationService = context.app.service('invitation');
    const q = {
      $limit: 1,
      code: data.code
    };
    const res = await invitationService.find({ query: q });
    if (res.total === 0) {
      throw new NotAuthenticated('Not a valid invitation code');
    } else {
      const entity = res.data[0];
      // TODO hash and set password (if missing) or compare password hash (if defined)
      return {
        type: 'invitation',
        entity: entity
      };
    }
  }
}

module.exports = app => {
  const authentication = new AuthenticationService(app);

  authentication.register('jwt', new JWTStrategy());
  authentication.register('local', new ActiveLocalStrategy());
  authentication.register('anonymous', new AnonymousStrategy());
  authentication.register('api-key', new APIKeyStrategy());

  app.use('/authentication', authentication);
  const authenticationConfig = app.get('authentication');
  app.service('authentication').hooks({
    after: {
      create: [authActivity(), totp2fa({
        usersService: 'user',
        applicationName: authenticationConfig.jwtOptions.issuer,
        cryptoUtil: app.get('crypto')
      })]
    }
  });
  app.configure(expressOauth());
};
