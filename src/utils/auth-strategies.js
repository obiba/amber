const { NotAuthenticated } = require('@feathersjs/errors');
const { AuthenticationBaseStrategy } = require('@feathersjs/authentication');
const { LocalStrategy } = require('@feathersjs/authentication-local');
const bcrypt = require('bcryptjs');

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

class ApiKeyStrategy extends AuthenticationBaseStrategy {
  async authenticate(authentication) {
    const { token } = authentication;
  
    const config = this.authentication.configuration[this.name];

    const match = config.allowedKeys.includes(token);
    if (!match) throw new NotAuthenticated('Incorrect API Key');
  
    return {
      apiKey: true
    };
  }
}

class ParticipantStrategy extends AuthenticationBaseStrategy {

  // eslint-disable-next-line no-unused-vars
  async authenticate(data) {
    // find an participant by the provided code
    // if no such participant code is found throw a NotAuthenticated exception
    // else attach the participant to the returned result
    // const participantService = this.app.service('participant');
    const entityService = this.entityService;
    const q = {
      $limit: 1,
      code: data.code
    };
    const res = await entityService.find({ query: q });
    if (res.total === 0) {
      throw new NotAuthenticated('Not a valid participant code');
    } else {
      const participant = res.data[0];
      const now = new Date().getTime();
      if (!participant.activated
        || (participant.validFrom && now < participant.validFrom.getTime())
        || (participant.validUntil && now > participant.validUntil.getTime())) {
        throw new NotAuthenticated('Not a valid participant code');
      }
      const campaign = await this.app.service('campaign').get(participant.campaign);
      if ((campaign.validFrom && now < campaign.validFrom.getTime())
        || (campaign.validUntil && now > campaign.validUntil.getTime())) {
        throw new NotAuthenticated('Not a valid participant code');
      }
      // Password check, requirement is configured at the campaign definition level?
      if (campaign.withPassword) {
        if (!data.password) {
          throw new NotAuthenticated('A participant password is required');
        } else {
          if (participant.password) {
            // following visits: compare password hashes
            const result = await bcrypt.compare(data.password, participant.password);
            if (!result) {
              throw new NotAuthenticated('Wrong participant password');
            }
          } else {
            // first visit: set password (hash and checks will happen in a participant service hook)
            await entityService.patch(participant._id, { password: data.password });
          }
        }
      }
      // track last activity
      entityService.patch(participant._id, { lastSeen: new Date() });
      return {
        participant
      };
    }
  }
}

module.exports = { AnonymousStrategy, ActiveLocalStrategy, ApiKeyStrategy, ParticipantStrategy };