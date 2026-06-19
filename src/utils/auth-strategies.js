const { randomBytes } = require('crypto');
const { NotAuthenticated } = require('@feathersjs/errors');
const { AuthenticationBaseStrategy } = require('@feathersjs/authentication');
const { LocalStrategy } = require('@feathersjs/authentication-local');
const { OAuthStrategy } = require('@feathersjs/authentication-oauth');
const { Issuer } = require('openid-client');
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
    if (!data.data || typeof data.data !== 'object') {
      throw new NotAuthenticated('Walk-in participant data is missing or not an object');
    }
    const campaign = await this.app.service('campaign').get(data.campaign);
    if (campaign.walkInEnabled !== true) {
      throw new NotAuthenticated('Walk-in participants are not allowed for this campaign');
    }
    const noDataInput = !data.data || Object.keys(data.data).length === 0;
    // check if walk-in data keys are provided
    if (campaign.walkInData && Object.keys(campaign.walkInData).length > 0) {
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
    // if data is empty, this is a new participant, otherwise check if a participant with the same data already exists
    if (!noDataInput) {
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

// Base for all social OAuth providers.
// Overrides createEntity/updateEntity to use internal service calls,
// bypassing external hooks (reCAPTCHA, registration validation, CASL authorize).
class BaseOAuthUserStrategy extends OAuthStrategy {
  _randomPassword() {
    // Satisfies the strong password regex: upper + lower + digit + special + entropy
    return `Oa!1${randomBytes(12).toString('hex')}`;
  }

  _trimName(s, fallback) {
    const v = (s || '').trim().slice(0, 30);
    return v.length >= 2 ? v : (fallback || 'User').padEnd(2, '_').slice(0, 30);
  }

  async createEntity(profile, params) {
    const data = await this.getEntityData(profile, null, params);
    return this.entityService.create(data, {});
  }

  async updateEntity(entity, profile, params) {
    const id = entity[this.entityId];
    const data = await this.getEntityData(profile, entity, params);
    return this.entityService.patch(id, data, {});
  }

  async getEntity(result, params) {
    // Strip provider so the user-service get() is an internal call,
    // bypassing authenticate/authorize hooks that require a JWT.
    // The base implementation returns result directly when provider is absent.
    const { provider: _provider, ...internalParams } = params;
    return super.getEntity(result, internalParams);
  }
}

class GithubStrategy extends BaseOAuthUserStrategy {
  async getEntityQuery(profile, _params) {
    return { githubId: profile.id };
  }

  async getEntityData(profile, existingEntity, _params) {
    const data = { githubId: profile.id };
    if (existingEntity) return data;

    const parts = (profile.name || profile.login || '').trim().split(/\s+/);
    const login = profile.login || 'OAuth';
    data.email = profile.email || profile.notification_email;
    data.firstname = this._trimName(parts[0], login);
    data.lastname = this._trimName(parts.slice(1).join(' ') || parts[0], login);
    if (profile.company) {
      data.institution = (profile.company || '').trim().slice(0, 100);
    }
    if (profile.location) {
      data.city = (profile.location || '').trim().slice(0, 30);
    }
    if (profile.bio) {
      data.title = (profile.bio || '').trim().slice(0, 30);
    }
    if (profile.phone) {
      data.phone = profile.phone.trim().slice(0, 30);
    }
    data.role = 'guest';
    data.language = (profile.locale || '').slice(0, 5) || (profile.lang || '').slice(0, 5) || 'en';
    data.password = this._randomPassword();
    return data;
  }
}

class GoogleStrategy extends BaseOAuthUserStrategy {
  async getEntityQuery(profile, _params) {
    return { googleId: profile.sub || profile.id };
  }

  async getEntityData(profile, existingEntity, _params) {
    const data = { googleId: profile.sub || profile.id };
    if (existingEntity) return data;

    data.email = profile.email;
    data.firstname = this._trimName(profile.given_name, profile.name);
    data.lastname = this._trimName(profile.family_name, profile.name);
    data.language = (profile.locale || '').slice(0, 5) || (profile.lang || '').slice(0, 5) || 'en';
    data.role = 'guest';
    data.password = this._randomPassword();
    return data;
  }
}

class OidcStrategy extends BaseOAuthUserStrategy {
  // Caches the promise so concurrent calls during startup don't trigger multiple discoveries
  async _getClient() {
    if (!this._clientPromise) {
      this._clientPromise = (async () => {
        const { issuer_url, key, secret } = this.configuration;
        if (!issuer_url) throw new Error('OidcStrategy requires issuer_url in oauth.oidc config');
        const issuer = await Issuer.discover(issuer_url);
        return new issuer.Client({ client_id: key, client_secret: secret });
      })();
    }
    return this._clientPromise;
  }

  async getProfile(data, _params) {
    const client = await this._getClient();
    return client.userinfo(data.access_token);
  }

  async getEntityQuery(profile, _params) {
    return { oidcId: profile.sub };
  }

  async getEntityData(profile, existingEntity, _params) {
    const data = { oidcId: profile.sub };
    if (existingEntity) return data;

    if (profile.email) data.email = profile.email;
    data.firstname = this._trimName(profile.given_name, profile.name);
    data.lastname = this._trimName(profile.family_name, profile.name);
    if (profile.locale) data.language = profile.locale.slice(0, 5);
    data.role = 'guest';
    data.language = (profile.locale || '').slice(0, 5) || (profile.lang || '').slice(0, 5) || 'en';
    data.password = this._randomPassword();
    return data;
  }
}

module.exports = { AnonymousStrategy, ActiveLocalStrategy, ApiKeyStrategy, ParticipantStrategy, WalkInParticipantStrategy, BaseOAuthUserStrategy, GithubStrategy, GoogleStrategy, OidcStrategy };
