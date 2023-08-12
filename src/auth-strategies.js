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

class ParticipantStrategy extends AuthenticationBaseStrategy {
  
  async hashPassword (password) {
    return bcrypt.hash(password, this.configuration.hashSize || 10);
  }

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
      // Password check
      // FIXME should it be configured at the campaign definition level?
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
            // first visit: hash and set password
            // FIXME set some password rules (at least min length)
            const pwd = await this.hashPassword(data.password);
            entityService.patch(participant._id, { password: pwd });
          }
        }
      }
      return {
        participant
      };
    }
  }
}

module.exports = { AnonymousStrategy, ActiveLocalStrategy, ParticipantStrategy };