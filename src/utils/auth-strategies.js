const { NotAuthenticated } = require('@feathersjs/errors');
const { AuthenticationBaseStrategy } = require('@feathersjs/authentication');
const { LocalStrategy } = require('@feathersjs/authentication-local');
const { isParticipantValid, isCampaignValid } = require('./participant-validity');
const { comparePassword } = require('./password-hasher');
const { get } = require('lodash');

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

  async comparePassword (entity, password) {
    const { entityPasswordField, errorMessage } = this.configuration;
    // find password in entity, this allows for dot notation
    const hash = get(entity, entityPasswordField);

    if (!hash) {
      throw new NotAuthenticated(errorMessage);
    }
    const result = await comparePassword(password, hash);

    if (result) {
      return entity;
    }

    throw new NotAuthenticated(errorMessage);
  }
}

class ApiKeyStrategy extends AuthenticationBaseStrategy {
  async authenticate(authentication) {
    const { token } = authentication;

    const config = this.authentication.configuration[this.name];

    const match = config.allowedKeys.includes(token) && token !== 'CHANGEME';
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
      if (!isParticipantValid(participant)) {
        throw new NotAuthenticated('Not a valid participant code');
      }
      const campaign = await this.app.service('campaign').get(participant.campaign);
      if (!isCampaignValid(campaign)) {
        throw new NotAuthenticated('Not a valid participant code');
      }
      // Password check, requirement is configured at the campaign definition level?
      if (campaign.withPassword) {
        if (!data.password) {
          throw new NotAuthenticated('A participant password is required');
        } else {
          if (participant.password) {
            // following visits: compare password hashes
            const result = await comparePassword(data.password, participant.password);
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

class WalkInParticipantStrategy extends ParticipantStrategy {
 
  async authenticate(data) {
    // find the campaign by the provided campaign id
    if (!data.campaign) {
      throw new NotAuthenticated('No campaign provided for walk-in participant authentication');
    }
    const campaign = await this.app.service('campaign').get(data.campaign);
    if (campaign.walkInEnabled !== true) {
      throw new NotAuthenticated('Walk-in participants are not allowed for this campaign');
    }
    // check if walk-in data keys are provided
    if (campaign.walkInData && Object.keys(campaign.walkInData).length > 0) {
      if (!data.data || typeof data.data !== 'object') {
        throw new NotAuthenticated('Walk-in participant data is missing or not an object');
      }
      const walkInDataKeys = Object.keys(campaign.walkInData);
      const newData = {};  
      for (const key of walkInDataKeys) {
        if (campaign.walkInData[key] === null && !data.data[key]) {
          throw new NotAuthenticated(`Walk-in participant data is missing: ${key}`);
        }
        if (data.data[key] !== undefined) {
          newData[key] = data.data[key]; // use provided data
        } else {
          newData[key] = campaign.walkInData[key]; // use default value
        }
      }
      data.data = newData; // update data with walk-in data
    }
    // find if a participant already exists for this campaign with the same data
    const participantService = this.app.service('participant');
    const existingParticipant = await participantService.find({
      query: {
        campaign: data.campaign,
        activated: true,
        // match true walk-ins: either null or not set
        $or: [
          { createdBy: { $eq: null } },
          { createdBy: { $exists: false } }
        ],
        data: { $eq: data.data }, // match the provided data
        $limit: 1
      }
    });
    if (existingParticipant.total > 0) {
      // if a participant already exists, return it
      return super.authenticate({
        code: existingParticipant.data[0].code, // use the existing participant code
        password: data.password // if password is provided, it will be checked
      });
    }
    // create a new participant with the provided data
    const participant = await participantService.create({
      data: data.data || {}, // walk-in data
      campaign: data.campaign,
      validFrom: new Date(), // valid from now
      validUntil: null, // no expiration for walk-in participants
      activated: true, // walk-in participants are always activated
      createdBy: null, // no specific creator for walk-in participants
      lastSeen: new Date() // track last activity
    });
    return {
      participant
    };
  }
}

module.exports = { AnonymousStrategy, ActiveLocalStrategy, ApiKeyStrategy, ParticipantStrategy, WalkInParticipantStrategy };
