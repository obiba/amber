const { BadRequest, Forbidden } = require('@feathersjs/errors');

/* eslint-disable no-unused-vars */
exports.Itws = class Itws {
  constructor (options, app) {
    this.options = options || {};
    this.app = app;
  }

  async find (params) {
    if (params.user && !['interviewer', 'manager', 'administrator'].includes(params.user.role)) {
      throw new Forbidden('You are not an interviewer');
    }
    // resolve participant
    let participant = params.participant;
    if (!participant) {
      if (params.query.code) {
        // get participant from the code in the query
        const res = await this.app.service('participant').find({ query: { code: params.query.code } });
        if (res.total === 0) {
          throw new BadRequest('Participant not found');
        }
        participant = res.data[0];
        const now = new Date().getTime();
        if (!participant.activated 
          || (participant.validFrom && now < participant.validFrom.getTime()) 
          || (participant.validUntil && now > participant.validUntil.getTime())) {
          throw new BadRequest('Not a valid participant code');
        }
      } else  {
        throw new BadRequest('Participant code is missing');
      }
    } // else participant auth itself, so it is valid
    const participantData = {
      _id: participant._id,
      code: participant.code,
      identifier: participant.identifier,
      data: participant.data
    };

    // get associated campaign's investigators
    let result = await this.app.service('campaign').find({ query: { _id: participant.campaign } });
    const campaign = result.data[0];
    // an interviewer must be one of the investigators
    if (params.user) {
      if (params.user.role === 'interviewer' && !campaign.investigators.map(id => id.toString()).includes(params.user._id.toString())) {
        throw new Forbidden('Your not an investigator');
      }
    }
    result = await this.app.service('user').find({ query: { _id: { $in: campaign.investigators } } });
    const investigators = result.data.map(user => {
      return {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
        institution: user.institution,
        city: user.city
      };
    });

    // request is for a participant, then list only its associated interview design
    params.query._id = participant.interviewDesign;
    params.query.state = 'active';
    delete params.query.code;
    result = await this.app.service('interview-design').find(params);
    
    const formRevisionService = this.app.service('form-revision');
    const data = [];
    for (const itwd of result.data) {
      const itwdata = {
        _id: itwd._id,
        name: itwd.name,
        label: itwd.label,
        description: itwd.description,
        steps: [],
        i18n: itwd.i18n,
        participant: participantData,
        investigators: investigators
      };
      for (const step of itwd.steps) {
        const q = {
          $limit: 1,
          $sort: { revision: -1 },
          form: step.form
        };
        if (step.revision) {
          q.revision = step.revision;
        }
        const frResult = await formRevisionService.find({
          query: q
        });
        if (frResult.total > 0) {
          itwdata.steps.push({
            _id: step._id,
            name: step.name,
            label: step.label,
            description: step.description,
            schema: frResult.data[0].schema,
            revision: frResult.data[0].revision
          });
        }
      }
      data.push(itwdata);
    }
    result.data = data;
    return result;
  }

  async get (id, params) {
    throw new BadRequest('Not implemented');
  }

  async create (data, params) {
    throw new BadRequest('Not implemented');
  }

  async update (id, data, params) {
    throw new BadRequest('Not implemented');
  }

  async patch (id, data, params) {
    throw new BadRequest('Not implemented');
  }

  async remove (id, params) {
    throw new BadRequest('Not implemented');
  }
};
